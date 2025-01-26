import { Component } from '../component'
import { listComponent } from '../composite/list'

import {
  Route, StaticRoute, DynamicRoute, RegexRoute, ParamRoute
} from './route-component'

import { 
  ExtensibleComponent 
} from '../extensible-component'

import { 
  combineBuilderWithMiddleware
} from '../util/middleware'

export class RouteList extends ExtensibleComponent {
  constructor(options={}) {
    super(options)

    this.subComponents.routeList = listComponent()
  }

  get routes() {
    return this.subComponents.routeList.array
  }

  toRouteBuildSpecs() {
    const middleware = this.toExtendMiddleware()

    return this.routes.map(route => {
      const builder = route.toHandleableBuilder()
      const routeSpec = route.routeSpec

      routeSpec.builder = combineBuilderWithMiddleware(
        builder, middleware)

      return routeSpec
    })
  }

  addRoute(route) {
    if(!route.isRoute) {
      throw new Error('route must be of type Route')
    }

    this.routes.push(route)

    return this
  }

  staticRoute(path, handler) {
    return this.addRoute(new StaticRoute(handler, path))
  }

  paramRoute(path, handler) {
    return this.addRoute(new ParamRoute(handler, path))
  }

  regexRoute(regex, fields, handler) {
    return this.addRoute(new RegexRoute(handler, regex, fields))
  }

  dynamicRoute(matcher, handler) {
    return this.addRoute(new DynamicRoute(handler, matcher))
  }

  get type() {
    return 'route list'
  }

  get isRouteList() {
    return true
  }

  toJson() {
    const json = super.toJson()
    
    const routes = this.routes

    if(routes.length > 0)
      json.routes = this.routes.map(route => route.toJson())
    
    json.middlewares = this.middlewareJson()

    return json
  }
}

export const routeList = options =>
  new RouteList(options)