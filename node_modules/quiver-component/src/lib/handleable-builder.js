import { resolve } from 'quiver-promise'

import { safeHandler } from './util/wrap'
import { ExtensibleHandler } from './extensible-component'

export class HandleableBuilder extends ExtensibleHandler {
  constructor(handleableBuilder, options={}) {
    const mainHandleableBuilder = safeHandler(
      handleableBuilder, options)

    super(options)

    this._mainHandleableBuilder = mainHandleableBuilder
  }

  toMainHandleableBuilder() {
    return this._mainHandleableBuilder
  }

  get type() {
    return 'handleable builder'
  }
}

export class Handleable extends HandleableBuilder {
  constructor(handleable, options={}) {
    options.safeWrapped = true
    super(null, options)
    
    this._handleable = handleable
  }

  toMainHandleableBuilder() {
    const handleable = this.toHandleable()

    return config => resolve(handleable)
  }

  toHandleable() {
    if(!this._handleable) throw new Error(
      'handleable is not defined')

    return this._handleable
  }

  get type() {
    return 'handleable'
  }
}

export const handleableBuilder = (builder, options) =>
  new HandleableBuilder(builder, options)

export const handleable = (handleable, options) =>
  new Handleable(handleable, options)