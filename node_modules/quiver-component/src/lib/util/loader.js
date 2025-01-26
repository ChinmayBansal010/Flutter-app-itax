import { resolve, reject } from 'quiver-promise'
import {
  streamToSimpleHandler, validateSimpleTypes
} from 'quiver-simple-handler'

import { getHandlerMap } from './config'

export const loadHandleable = 
(config, componentId, builder) => {
  const handlerMap = getHandlerMap(config)

  const handleable = handlerMap[componentId]
  if(handleable) return resolve(handleable)

  return builder(config).then(handleable => {
    if(!handleable) return reject(new Error(
      'handleable is not defined in builder result'))

    handlerMap[componentId] = handleable

    return handleable
  })
}

export const loadStreamHandler = (...args) =>
  loadHandleable(...args).then(handleable => {
    const handler = handleable.streamHandler
    if(!handler) return reject(new Error(
      'handleable is not a stream handler'))

    return handler
  })

export const loadHttpHandler = (...args) =>
  loadHandleable(...args).then(handleable => {
    const handler = handleable.httpHandler
    if(!handler) return reject(new Error(
      'handleable is not a http handler'))

    return handler
  })

export const loadSimpleHandler = 
(config, componentId, builder, inType, outType) =>  {
  const err = validateSimpleTypes([inType, outType])
  if(err) return reject(err)

  return loadStreamHandler(config, componentId, builder)
  .then(handler => 
    streamToSimpleHandler(handler, inType, outType))
}

export const simpleHandlerLoader = (inType, outType) =>
  (config, componentId, builder) =>
    loadSimpleHandler(config, componentId, builder, inType, outType)