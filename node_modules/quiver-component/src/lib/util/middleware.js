import { getInitTable } from './config'

const noopMiddleware = (config, builder) => builder(config)

export const combineBuilderWithMiddleware = (builder, middleware) =>
  config => middleware(config, builder)

export const combineBuilderWithMiddlewares = (builder, middlewares) =>
  middlewares.reduce(combineBuilderWithMiddleware, builder)

export const combineTwoMiddlewares = (middleware1, middleware2) =>
  (config, builder) => middleware2(config, 
    combineBuilderWithMiddleware(builder, middleware1))

export const combineMiddlewares = middlewares => {
  const count = middlewares.length
  
  if(count==0) return noopMiddleware
  if(count==1) return middlewares[0]

  return middlewares.slice(1).reduce(
    combineTwoMiddlewares, middlewares[0])
}

export const combineMiddlewareComponents = components =>
  combineMiddlewares(components.map(component => 
    component.toHandleableMiddleware()))