import { copy } from 'quiver-object'
import { resolve } from 'quiver-promise'
import assign from 'object.assign'

import { StreamHandlerBuilder } from './stream-handler'
import { StreamFilter, HttpFilter } from './filter'
import { safeBuilder, safeHandler } from './util/wrap'

const argsToStreamFilter = argsHandler =>
  (config, handler) =>
    resolve((args, inputStreamable) =>
      argsHandler(args).then(newArgs=args =>
        handler(newArgs, inputStreamable)))

const errorToFilter = errorHandler =>
  (config, handler) =>
    resolve((...args) =>
      handler(...args).catch(err => 
        errorHandler(err)
        .then(result => {
          if(!result) throw err
          return result
        })))

const builderFilterConvert = (builder, filterConvert) =>
  (config, handler) =>
    builder(config).then(customHandler =>
      filterConvert(customHandler)(config, handler))

const applyArgsFilter = (argsHandler, handler) =>
  (args, inputStreamable) =>
    argsHandler(args).then((newArgs=args) => 
      handler(newArgs, inputStreamable))

const argsBuilderToFilter = argsBuilder =>
  (config, handler) =>
    argsBuilder(config).then(argsHandler =>
      applyArgsFilter(argsHandler, handler))

export class ArgsBuilderFilter extends StreamFilter {
  constructor(argsBuilder, options={}) {
    argsBuilder = safeBuilder(argsBuilder, options)
    
    if(options.copyConfig === undefined)
      options.copyConfig = true

    super(null, options)

    this._argsBuilder = argsBuilder
  }

  toStreamFilter() {
    return argsBuilderToFilter(this.toArgsBuilder())
  }

  toArgsBuilder() {
    if(!this._argsBuilder) throw new Error(
      'argsBuilder is not defined')

    return this._argsBuilder
  }

  get type() {
    return 'args builder filter'
  }
}

export class ArgsFilter extends ArgsBuilderFilter {
  constructor(argsHandler, options={}) {
    argsHandler = safeHandler(argsHandler, options)
    options.copyConfig = false

    super(null, options)
    this._argsHandler = argsHandler
  }

  toArgsBuilder() {
    const argsHandler = this.toArgsHandler()

    return config => resolve(argsHandler)
  }

  toArgsHandler() {
    if(!this._argsHandler) throw new Error(
      'argsHandler is not defined')

    return this._argsHandler
  }

  get type() {
    return 'args filter'
  }
}

export class ErrorFilter extends StreamFilter {
  constructor(errorHandler, options={}) {
    errorHandler = safeHandler(errorHandler, options)

    super(null, options)
    this._errorHandler = errorHandler
  }

  toStreamFilter() {
    return errorToFilter(this.toErrorHandler())
  }

  toErrorHandler() {
    if(!this._errorHandler) throw new Error(
      'errorHandler is not defined')

    return this._errorHandler
  }

  get type() {
    return 'error filter'
  }
}

export class ErrorBuilderFilter extends StreamFilter {
  constructor(errorBuilder, options={}) {
    errorBuilder = safeBuilder(errorBuilder, options)

    super(null, options)
    this._errorBuilder = errorBuilder
  }

  toStreamFilter() {
    return builderFilterConvert(
      this.toErrorBuilder(), errorToFilter)
  }

  toErrorBuilder() {
    if(!this._errorBuilder) throw new Error(
      'errorBuilder is not defined')

    return this._errorBuilder
  }

  get type() {
    return 'error builder filter'
  }
}

const ArgsFilterMixin = {
  argsFilter(argsHandler) {
    return this.middleware(new ArgsFilter(argsHandler))
  }
}

const mixinArgsFilter = prototype =>
  assign(prototype, ArgsFilterMixin)

mixinArgsFilter(StreamHandlerBuilder.prototype)

export const argsFilter = (handler, options) =>
  new ArgsFilter(handler, options)

export const argsBuilderFilter = (builder, options) =>
  new ArgsBuilderFilter(builder, options)

export const errorFilter = (handler, options) =>
  new ErrorFilter(handler, options)

export const errorBuilderFilter = (builder, options) =>
  new ErrorBuilderFilter(builder, options)