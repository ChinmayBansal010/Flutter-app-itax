import { safeHandler } from './util/wrap'
import { ExtensibleMiddleware } from './extensible-component'
import { combineMiddlewares } from './util/middleware'

export class HandleableMiddleware extends ExtensibleMiddleware {
  constructor(handleableMiddleware, options={}) {
    handleableMiddleware = safeHandler(
      handleableMiddleware, options)
    
    super(options)

    this._handleableMiddleware = handleableMiddleware
  }

  toMainHandleableMiddleware() {
    const middleware = this._handleableMiddleware

    if(!middleware) throw new Error(
      'mainHandleableMiddleware is not defined')

    return middleware
  }

  get type() {
    return 'Handleable Middleware'
  }
}

export const handleableMiddleware = (middleware, options) =>
  new HandleableMiddleware(middleware, options)