import assign from 'object.assign'

import { 
  ExtensibleHandler, ExtensibleMiddleware 
} from './extensible-component'

const _componentKey = Symbol('_componentKey')

const defineAbstractComponent = (Parent, mixin) => {
  class AbstractComponent extends Parent {
    constructor(componentKey, options={}) {
      super(options)
      this[_componentKey] = componentKey
    }

    implement(componentMap) {
      if(!this.concreteComponent) {
        const componentKey = this[_componentKey]
        const concreteComponent = componentMap[componentKey]

        if(concreteComponent) {
          this.validateConcreteComponent(concreteComponent)
          this.subComponents.concreteComponent = concreteComponent
        }
      }

      return super.implement(componentMap)
    }

    get concreteComponent() {
      return this.subComponents.concreteComponent
    }
  }

  assign(AbstractComponent.prototype, mixin)

  return AbstractComponent
}

export const AbstractHandler = defineAbstractComponent(
  ExtensibleHandler, {
    toMainHandleableBuilder() {
      const { concreteComponent } = this

      if(!concreteComponent) {
        throw new Error('Abstract handler component '+ 
          'not implemented: ' + this[_componentKey])
      }

      return concreteComponent.toHandleableBuilder()
    },

    validateConcreteComponent(component) {
      if(!component.isHandlerComponent) {
        throw new Error('Concrete component in ' +
          'implementation map is not handler component: ' + 
          componentKey)
      }
    }
  })

export const AbstractMiddleware = defineAbstractComponent(
  ExtensibleMiddleware, {
    toMainHandleableMiddleware() {
      const { concreteComponent } = this

      if(!concreteComponent)
        throw new Error('Abstract middleware component ' + 
          'not implemented: ' + this[_componentKey])

      return concreteComponent.toMainHandleableMiddleware()
    },

    validateConcreteComponent(component) {
      if(!component.isMiddlewareComponent) {
        throw new Error('Concrete component in ' +
          'implementation map is not middleware component: ' + 
          componentKey)
      }
    }
  })

export const abstractHandler = componentKey =>
  new AbstractHandler(componentKey)

export const abstractMiddleware = componentKey =>
  new AbstractMiddleware(componentKey)