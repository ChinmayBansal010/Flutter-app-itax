import { resolve } from 'quiver-promise'

import { 
  simpleToStreamHandler, 
  streamToSimpleHandler,
  validateSimpleTypes 
} from 'quiver-simple-handler'

import { simpleHandlerLoader } from './util/loader'
import { safeBuilder, safeHandler } from './util/wrap'
import { StreamHandler, StreamHandlerBuilder } from './stream-handler'

export class SimpleHandlerBuilder extends StreamHandlerBuilder {
  constructor(simpleHandlerBuilder, inType, outType, options={}) {
    const err = validateSimpleTypes([inType, outType])
    if(err) throw err

    simpleHandlerBuilder = safeBuilder(
      simpleHandlerBuilder, options)

    super(null, options)

    this._inType = inType
    this._outType = outType
    this._simpleHandlerBuilder = simpleHandlerBuilder
  }

  toStreamHandlerBuilder() {
    const { inType, outType } = this

    const simpleHandlerBuilder = this.toSimpleHandlerBuilder()

    return config =>
      simpleHandlerBuilder(config)
      .then(simpleHandler =>
        simpleToStreamHandler(simpleHandler, inType, outType))
  }

  toSimpleHandlerBuilder() {
    if(!this._simpleHandlerBuilder) throw new Error(
      'simpleHandlerBuilder is not define')

    return this._simpleHandlerBuilder
  }

  get defaultLoader() {
    return simpleHandlerLoader(this.inType, this.outType)
  }

  get inType() {
    return this._inType
  }

  get outType() {
    return this._outType
  }

  get type() {
    return 'simple handler builder'
  }

  toJson() {
    const json = super.toJson()

    json.inType = this.inType
    json.outType = this.outType

    return json
  }
}

export class SimpleHandler extends SimpleHandlerBuilder {
  constructor(simpleHandler, inType, outType, options={}) {
    simpleHandler = safeHandler(simpleHandler, options)

    super(null, inType, outType, options)
    this._simpleHandler = simpleHandler
  }

  toSimpleHandlerBuilder() {
    const simpleHandler = this.toSimpleHandler()

    return config =>
      resolve(simpleHandler)
  }

  toSimpleHandler() {
    if(!this._simpleHandler) throw new Error(
      'simpleHandler is not defined')

    return this._simpleHandler
  }

  get type() {
    return 'simple handler'
  }
}

export const simpleHandlerBuilder = (builder, inType, outType, options) =>
  new SimpleHandlerBuilder(builder, inType, outType, options)

export const simpleHandler = (handler, inType, outType, options) =>
  new SimpleHandler(handler, inType, outType, options)