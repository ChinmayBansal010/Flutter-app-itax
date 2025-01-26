import { copy } from 'quiver-object'
import { error } from 'quiver-error'
import { async, reject } from 'quiver-promise'
import { streamToHttpHandler } from 'quiver-http'

const getHandlerFromPath = (routeIndex, path, args) => {
  const staticHandler = routeIndex.staticRoutes[path]
  if(staticHandler) return staticHandler

  const dynamicRoutes = routeIndex.dynamicRoutes

  for(let route of dynamicRoutes) {
    const matched = route.matcher(path, args)
    if(matched) return route.handler
  }

  if(routeIndex.defaultRoute)
    return routeIndex.defaultRoute

  return null
}

const httpRouterHandler = routeIndex =>
  (requestHead, requestStreamable) => {
    const { args, path } = requestHead

    const handler = getHandlerFromPath(routeIndex, path, args)
    if(!handler) return reject(error(404, 'not found'))

    return handler(requestHead, requestStreamable)
  }

const streamRouterHandler = routeIndex =>
  (args, streamable) => {
    const { path='/' } = args

    const handler = getHandlerFromPath(routeIndex, path, args)
    if(!handler) return reject(error(404, 'not found'))

    return handler(args, streamable)
  }

const handleableToStreamHandler = handleable =>
  handleable.streamHandler

const handleableToHttpHandler = handleable => {
  if(handleable.httpHandler) 
    return handleable.httpHandler

  if(handleable.streamHandler)
    return streamToHttpHandler(
      handleable.streamHandler)

  return null
}

const routeSpecsToRouteIndex = (routeSpecs, getHandler) => {
  const staticRoutes = {}
  const dynamicRoutes = []
  let defaultRoute = null

  routeSpecs.forEach(routeSpec => {
    const { routeType, handleable } = routeSpec

    const handler = getHandler(handleable)
    if(!handler) return

    if(routeType == 'static') {
      const { path } = routeSpec
      staticRoutes[path] = handler

    } else if(routeType == 'dynamic') {
      const { matcher } = routeSpec
      dynamicRoutes.push({ matcher, handler })

    } else if(routeType == 'default') {
      defaultRoute = handler
    }
  })

  return {
    staticRoutes,
    dynamicRoutes,
    defaultRoute
  }
}

export const routeSpecsToRouterHandleable = routeSpecs => {
  const streamIndex = routeSpecsToRouteIndex(routeSpecs,
    handleableToStreamHandler)

  const httpIndex = routeSpecsToRouteIndex(routeSpecs,
    handleableToHttpHandler)

  const streamHandler = streamRouterHandler(streamIndex)
  const httpHandler = httpRouterHandler(httpIndex)

  return {
    streamHandler,
    httpHandler
  }
}

const routeBuildSpecsToRouteSpecs = async(
function*(config, routeBuildSpecs) {
  const routeSpecs = []

  for(let i=0; i<routeBuildSpecs.length; i++) {
    const routeBuildSpec = routeBuildSpecs[i]
    const builder = routeBuildSpec.builder
    const routeSpec = copy(routeBuildSpec)

    routeSpec.handleable = yield builder(config)
    routeSpecs.push(routeSpec)
  }

  return routeSpecs
})

export const routeBuildSpecsToRouterBuilder = routeBuildSpecs =>
  async(function*(config) {
    const routeSpecs = yield routeBuildSpecsToRouteSpecs(
      config, routeBuildSpecs)

    return routeSpecsToRouterHandleable(routeSpecs)
  })