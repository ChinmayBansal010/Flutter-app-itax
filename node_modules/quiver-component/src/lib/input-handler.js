import { assertString } from 'quiver-object'
import assign from 'object.assign'

import { ConfigMiddleware } from './simple-middleware'
import { HandlerComponent } from './component'
import { ExtensibleComponent } from './extensible-component'

export class InputHandlerMiddleware extends ConfigMiddleware {
  constructor(handlerComponent, toConfig, options={}) {
    if(!handlerComponent.isHandlerComponent) {
      throw new TypeError(
        'input handler must be of type HandlerComponent')
    }

    assertString(toConfig, 'toConfig required to be string')

    const { 
      loader=handlerComponent.handlerLoader
    } = options

    options.safeWrapped = true

    super(null, options)
    
    this._handlerLoader = loader
    this._toInputConfig = toConfig

    this.subComponents.inputHandler = handlerComponent
  }

  toConfigHandler() {
    const handlerComponent = this.inputHandlerComponent

    const componentId = handlerComponent.id
    const builder = handlerComponent.toHandleableBuilder()

    const loader = this._handlerLoader
    const toConfig = this._toInputConfig

    return config =>
      loader(config, componentId, builder)
      .then(handler => {
        config[toConfig] = handler
      })
  }

  get inputHandlerComponent() {
    return this.subComponents.inputHandler
  }

  get type() {
    return 'input handler middleware'
  }

  toJson() {
    const json = super.toJson()
    json.inputHandler = this.inputHandlerComponent.toJson()
    return json
  }
}

const InputHandlerMixin = {
  inputHandler(handler, toConfig, options={}) {
    return this.middleware(
      new InputHandlerMiddleware(
        handler, toConfig, options))
  },
  inputHandlers(handlerMap) {
    for(let key in handlerMap) {
      const handler = handlerMap[key]
      this.inputHandler(handler, key)
    }
    return this
  }
}

const mixinInputHandler = prototype =>
  assign(prototype, InputHandlerMixin)

mixinInputHandler(ExtensibleComponent.prototype)

export const inputHandlerMiddleware = (handler, toConfig, options) =>
  new InputHandlerMiddleware(handler, toConfig, options)
