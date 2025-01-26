import { resolve } from 'quiver-promise'

import { loadStreamHandler } from './util/loader'
import { safeBuilder, safeHandler } from './util/wrap'
import { HandleableBuilder } from './handleable-builder'

export class StreamHandlerBuilder extends HandleableBuilder {
  constructor(streamHandlerBuilder, options={}) {
    streamHandlerBuilder = safeBuilder(
      streamHandlerBuilder, options)

    super(null, options)
    this._streamHandlerBuilder = streamHandlerBuilder
  }

  toMainHandleableBuilder() {
    const builder = this.toStreamHandlerBuilder()

    return config =>
      builder(config).then(streamHandler => ({ streamHandler }))
  }

  toStreamHandlerBuilder() {
    if(!this._streamHandlerBuilder) throw new Error(
      'streamHandlerBuilder is not defined')

    return this._streamHandlerBuilder
  }

  get defaultLoader() {
    return loadStreamHandler
  }

  get type() {
    return 'stream handler builder'
  }
}

export class StreamHandler extends StreamHandlerBuilder {
  constructor(streamHandler, options={}) {
    streamHandler = safeHandler(streamHandler, options)

    super(null, options)
    this._streamHandler = streamHandler
  }

  toStreamHandlerBuilder() {
    const handler = this.toStreamHandler()

    return config => resolve(handler)
  }

  toStreamHandler() {
    if(!this._streamHandler) throw new Error(
      'streamHandler is not defined')

    return this._streamHandler
  }

  get type() {
    return 'stream handler'
  }
}

export const streamHandlerBuilder = (builder, options) =>
  new StreamHandlerBuilder(builder, options)

export const streamHandler = (handler, options) =>
  new StreamHandler(handler, options)