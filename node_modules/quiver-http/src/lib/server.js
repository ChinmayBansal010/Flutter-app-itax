import http from 'http'
import { async } from 'quiver-promise'

const { createServer } = http

import { 
  httpToNodeHandler, streamToHttpHandler 
} from './handler.js'

export const startServer = async(
function*(component, config) {
  if(!component.isHandlerComponent) {
    throw new Error('First argument must be handler component')
  }

  const builder = component.toHandleableBuilder()
  const { serverListen=8080 } = config

  if(!config) throw new Error(
    'Config is not defined')

  const {
    streamHandler,
    httpHandler
  } = yield builder(config)

  if(!httpHandler && !streamHandler) throw new Error(
    'Component do not build any valid handler')

  const handler = httpHandler ? httpHandler :
    streamToHttpHandler(streamHandler)

  return createServer(httpToNodeHandler(handler))
    .listen(serverListen)
})