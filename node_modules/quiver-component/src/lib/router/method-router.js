import { error } from 'quiver-error'
import { resolve, async } from 'quiver-promise'
import { emptyStreamable } from 'quiver-stream-util'

import {
  ResponseHead, streamToHttpHandler 
} from 'quiver-http'

import { mapComponent } from '../composite/map'
import { HttpHandlerBuilder } from '../http-handler'

import { 
  loadHandleable
} from '../util/loader'

const headRequestHandler = handler =>
  (requestHead, requestStreamable) => {
    if(requestHead.method != 'HEAD') {
      return handler(requestHead, requestStreamable)
    }

    return handler(requestHead, requestStreamable)
    .then(([responseHead, responseStreamable]) =>
      ([responseHead, emptyStreamable()]))
  }

const optionsHandler = methods => {
  const allowedMethods = methods.join(', ') + ', OPTIONS'

  return (requestHead, requestStreamable) => 
    resolve([
      new ResponseHead({
        statusCode: 200,
        headers: {
          'content-length': '0',
          allow: allowedMethods
        }
      }),
      emptyStreamable()
    ])
}

const methodMapToHttpHandler = methodMap => {
  const allowedMethods = Object.keys(methodMap).join(', ')

  const methodNotAllowedResponse = () => ([
    new ResponseHead({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
      headers: {
        'content-length': '0',
        allow: allowedMethods
      }
    }),
    emptyStreamable()
  ])

  return (requestHead, requestStreamable) => {
    const method = requestHead.method
    const handler = methodMap[method]

    if(!handler) return methodNotAllowedResponse()

    return handler(requestHead, requestStreamable)
  }
}

const loadHttpHandler = async(
function*(config, component) {
  const handleable = yield loadHandleable(config, component.id, 
      component.builder)

  if(handleable.httpHandler) 
    return handleable.httpHandler

  if(handleable.streamHandler)
    return streamToHttpHandler(handleable.streamHandler)

  throw error(500, 'handleable is neither stream nor http handler')
})

const loadMethodHandlers = async(
function*(config, methodMap) {
  const handlerMap = { }

  for(let key in methodMap) {
    const component = methodMap[key]

    const handler = yield loadHttpHandler(config, component)

    handlerMap[key] = handler
  }

  if(handlerMap['GET'] && !handlerMap['HEAD']) {
    handlerMap['HEAD'] = headRequestHandler(handlerMap['GET'])
  }

  if(!handlerMap['OPTIONS']) {
    handlerMap['OPTIONS'] = optionsHandler(Object.keys(handlerMap))
  }

  return handlerMap
})

const methodObjectToMap = methodMap => {
  const map = new Map()

  for(let key in methodMap) {
    const handlerComponent = methodMap[key]
    if(!handlerComponent.isHandlerComponent) {
      throw new TypeError(
        'Method map entry value must be handler component')
    }

    map.set(key.toUpperCase(), handlerComponent)
  }

  return map
}

export class MethodRouter extends HttpHandlerBuilder {
  constructor(methodMap, options={}) {
    options.safeWrapped = true
    super(null, options)

    this.subComponents.methodMap = mapComponent(
      methodObjectToMap(methodMap))
  }

  toHttpHandlerBuilder() {
    const snapshot = {}
    const methodMap = this.subComponents.methodMap.map

    for(let [key, component] of methodMap.entries()) {
      snapshot[key] = {
        id: component.id,
        builder: component.toHandleableBuilder()
      }
    }

    return config =>
      loadMethodHandlers(config, snapshot)
      .then(methodMapToHttpHandler)
  }

  methodRoute(method, handlerComponent) {
    if(!handlerComponent.isHandlerComponent) {
      throw new TypeError(
        'Method map entry value must be handler component')
    }

    this.subComponents.methodMap.set(
      method.toUpperCase(), handlerComponent)
  }
}

export const methodRouter = methodMap =>
  new MethodRouter(methodMap)