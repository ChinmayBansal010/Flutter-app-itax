import { copy } from 'quiver-object'
import { resolve } from 'quiver-promise'
import { streamToHttpHandler } from 'quiver-http'

import { safeHandler, safeBuilder } from './util/wrap'
import { HandleableMiddleware } from './handleable-middleware'

const noCopy = config => config

export const filterToHandleableFilter = (filter, handlerKey) =>
  (config, handleable) => {
    const handler = handleable[handlerKey]
    if(!handler) return resolve(handleable)

    return filter(config, handler).then(filteredHandler => {
      handleable[handlerKey] = filteredHandler
      return handleable
    })
  }

export const streamToHandleableFilter = filter =>
  filterToHandleableFilter(filter, 'streamHandler')

export const httpToHandleableFilter = filter =>
  filterToHandleableFilter(filter, 'httpHandler')

export const filterToMiddleware = (filter, copyConfig) =>
  (config, builder) =>
    builder(copyConfig(config)).then(handler =>
      filter(config, handler))

export class HandleableFilter extends HandleableMiddleware {
  constructor(handleableFilter, options={}) {
    handleableFilter = safeHandler(handleableFilter, options)

    super(null, options)

    const { copyConfig=true } = options
    this._copyConfig = copyConfig

    this._handleableFilter = handleableFilter
  }

  toMainHandleableMiddleware() {
    const copyConfig = this._copyConfig ? copy : noCopy
    const handleableFilter = this.toHandleableFilter()

    return filterToMiddleware(
      handleableFilter, copyConfig)
  }

  toHandleableFilter() {
    if(!this._handleableFilter) throw new Error(
      'handleableFilter is not defined')

    return this._handleableFilter
  }
}

export class StreamFilter extends HandleableFilter {
  constructor(filter, options={}) {
    const streamFilter = safeBuilder(filter, options)
    super(null, options)

    this._streamFilter = streamFilter
  }

  toHandleableFilter() {
    const streamFilter = this.toStreamFilter()

    return (config, handleable) => {
      const handler = handleable.streamHandler
      if(!handler) return resolve(handleable)

      return streamFilter(config, handler)
      .then(filteredHandler => {
        handleable.streamHandler = filteredHandler
        return handleable
      })
    }
  }

  toStreamFilter() {
    const streamFilter = this._streamFilter

    if(!streamFilter) throw new Error(
      'streamFilter is not defined')

    return streamFilter
  }

  get type() {
    return 'Stream Filter'
  }
}

export class HttpFilter extends HandleableFilter {
  constructor(filter, options={}) {
    const httpFilter = safeBuilder(filter, options)
    super(null, options)

    this._httpFilter = httpFilter
  }

  toHandleableFilter() {
    const httpFilter = this.toHttpFilter()

    return (config, handleable) => {
      let httpHandler = handleable.httpHandler
      if(!httpHandler) {
        const streamHandler = handleable.streamHandler

        if(!streamHandler)
          return resolve(handleable)

        httpHandler = streamToHttpHandler(streamHandler)
        handleable = { httpHandler }
      }

      return httpFilter(config, httpHandler)
      .then(filteredHandler => {
        handleable.httpHandler = filteredHandler
        return handleable
      })
    }
  }

  toHttpFilter() {
    const httpFilter = this._httpFilter

    if(!httpFilter) throw new Error(
      'httpFilter is not defined')

    return httpFilter
  }

  get type() {
    return 'Http Filter'
  }
}

export const handleableFilter = (filter, options) =>
  new HandleableFilter(filter, options)

export const streamFilter = (filter, options) =>
  new StreamFilter(filter, options)

export const httpFilter = (filter, options) =>
  new HttpFilter(filter, options)