import { copy } from 'quiver-object'
import { resolve } from 'quiver-promise'

import { safeHandler } from './util/wrap'
import { HandleableMiddleware } from './handleable-middleware'
import { ExtensibleComponent } from './extensible-component'

const configHandlerToMiddleware = configHandler =>
  (config, builder) =>
    configHandler(config)
    .then((newConfig=config) =>
      builder(newConfig))

export class ConfigMiddleware extends HandleableMiddleware {
  constructor(configHandler, options={}) {
    configHandler = safeHandler(configHandler, options)

    super(null, options)
    this._configHandler = configHandler
  }

  toMainHandleableMiddleware() {
    const configHandler = this.toConfigHandler()

    return configHandlerToMiddleware(configHandler)
  }

  toConfigHandler() {
    if(!this._configHandler) throw new Error(
      'configHandler is not defined')

    return this._configHandler
  }

  get type() {
    return 'config middleware'
  }
}

export class ConfigOverrideMiddleware extends ConfigMiddleware {
  constructor(overrideConfig, options={}) {
    options.safeWrapped = true

    super(null, options)
    this._overrideConfig = overrideConfig
  }

  toConfigHandler() {
    const overrideConfig = this.overrideConfig

    return config => {
      for(let key in overrideConfig) {
        config[key] = overrideConfig[key]
      }

      return resolve(config)
    }
  }

  get overrideConfig() {
    return this._overrideConfig
  }

  get type() {
    return 'config override middleware'
  }

  toJson() {
    const json = super.toJson()

    json.overrideConfig = this.overrideConfig
    return json
  }
}

export class ConfigAliasMiddleware extends ConfigMiddleware {
  constructor(aliasConfig, options={}) {
    options.safeWrapped = true

    super(null, options)
    this._aliasConfig = aliasConfig
  }

  toConfigHandler() {
    const aliasConfig = this._aliasConfig

    return config => {
      for(let key in aliasConfig) {
        const aliasKey = aliasConfig[key]
        config[key] = config[aliasKey]
      }

      return resolve(config)
    }
  }

  get aliasConfig() {
    return copy(this._aliasConfig)
  }

  get type() {
    return 'config alias middleware'
  }

  toJson() {
    const json = super.toJson()

    json.aliasConfig = this.aliasConfig
    return json
  }
}

const mixinConfigOverride = prototype => {
  prototype.configOverride = function(config) {
    return this.addMiddleware(
      new ConfigOverrideMiddleware(config))
  }
}

const mixinConfigAlias = prototype => {
  prototype.configAlias = function(config) {
    return this.addMiddleware(
      new ConfigAliasMiddleware(config))
  }
}

mixinConfigOverride(ExtensibleComponent.prototype)
mixinConfigAlias(ExtensibleComponent.prototype)

export const configMiddleware = (handler) =>
  new ConfigMiddleware(handler)

export const configOverrideMiddleware = (config) =>
  new ConfigOverrideMiddleware(config)

export const configAliasMiddleware = (config) =>
  new ConfigAliasMiddleware(config)