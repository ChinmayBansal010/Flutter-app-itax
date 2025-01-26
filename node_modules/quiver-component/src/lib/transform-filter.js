import { resolve } from 'quiver-promise'
import { copy } from 'quiver-object'

import { StreamFilter } from './filter'
import { HandlerComponent } from './component'
import { loadStreamHandler } from './util/loader'

const validModes = {
  'in': true,
  'out': true,
  'inout': true
}

const echoHandler = (args, streamable) =>
  resolve(streamable)

const wrapHandler = handler =>
  (args, ...restArgs) =>
    handler(copy(args), ...restArgs)

const inTransformHandler = (handler, mode) =>
  mode != 'out' ? wrapHandler(handler): echoHandler

const wrapMainHandler = (handler, mode) =>
  mode == 'in' ? handler : wrapHandler(handler)

const outTransformHandler = (handler, mode) =>
  mode != 'in' ? handler : echoHandler

export class TransformFilter extends StreamFilter {
  constructor(handlerComponent, transformMode, options={}) {
    if(!handlerComponent.isHandlerComponent)
      throw new TypeError('input handler component must be of type HandlerComponent')

    if(!validModes[transformMode])
      throw new TypeError('invalid transform mode provided in options')

    options.safeWrapped = true

    super(null, options)

    this._transformMode = transformMode
    this.subComponents.transformComponent = handlerComponent
  }

  toStreamFilter() {
    const transformComponent = this.transformComponent

    const componentId = transformComponent.id
    const builder = transformComponent.toHandleableBuilder()

    const transformMode = this.transformMode

    return (config, handler) => 
      loadStreamHandler(config, componentId, builder)
      .then(transformHandler => {
        const transformIn = inTransformHandler(
          transformHandler, transformMode)

        const mainHandler = wrapMainHandler(
          handler, transformMode)

        const transformOut = outTransformHandler(
          transformHandler, transformMode)

        return (args, streamable) => 
          transformIn(args, streamable)
          .then(transformedIn =>
            mainHandler(args, transformedIn)
            .then(resultStreamable =>
              transformOut(args, resultStreamable)))
      })
  }

  get transformComponent() {
    return this.subComponents.transformComponent
  }

  get transformMode() {
    return this._transformMode
  }

  get type() {
    return 'transform filter'
  }

  toJson() {
    const json = super.toJson()

    json.transformMode = this.transformMode
    json.transformHandler = this.transformComponent.toJson()

    return json
  }
}

export const transformFilter = (handler, mode, options) => 
  new TransformFilter(handler, mode, options)