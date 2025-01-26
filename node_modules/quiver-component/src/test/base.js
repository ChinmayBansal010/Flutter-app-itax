import { async } from 'quiver-promise'

import {
  simpleHandlerBuilder, simpleHandler,
  transformFilter, configMiddleware
} from '../lib/export.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

describe('base component test', () => {
  it('single component test', () => {
    const original = simpleHandlerBuilder(
    config => {
      const { greet='Hello' } = config

      return (args, name) =>
        greet + ', ' + name
    }, 'text', 'text')

    const copy1 = original.fork()
    const copy2 = original.fork()

    should.equal(Object.getPrototypeOf(copy1), original)
    should.equal(Object.getPrototypeOf(copy2), original)

    should.not.equal(original.id, copy1.id)
    should.not.equal(original.id, copy2.id)
    should.not.equal(copy1.id, copy2.id)

    const config = { 
      greet: 'Hi'
    }

    return copy1.loadHandler(config)
    .then(handler =>
      handler({}, 'Alice')
        .should.eventually.equal('Hi, Alice'))
    .then(() => {
      config.greet = 'Yo'

      return copy1.loadHandler(config)
      .then(handler =>
        handler({}, 'Bob')
          .should.eventually.equal('Hi, Bob'))
    })
    .then(() => {
      config.greet = 'Bonjour'

      return copy2.loadHandler(config)
      .then(handler =>
        handler({}, 'Carl')
          .should.eventually.equal('Bonjour, Carl'))
    })
  })

  it('basic fork', () => {
    const original = simpleHandlerBuilder(
    config => {
      const { greet='Hello' } = config

      return (args, name) =>
        greet + ', ' + name
    }, 'text', 'text')

    const bundle1 = {}
    const copy1 = original.fork(bundle1)
    const copy11 = original.fork(bundle1)
    should.equal(copy1.id, copy11.id)
    should.equal(copy1, copy11)

    should.equal(Object.getPrototypeOf(copy1), original)

    const copy2 = original.fork()

    should.equal(Object.getPrototypeOf(copy2), original)

    should.not.equal(original.id, copy1.id)
    should.not.equal(original.id, copy2.id)
    should.not.equal(copy1.id, copy2.id)

    const bundle2 = {}
    const copy21 = copy2.fork(bundle2)
    const copy22 = copy2.fork(bundle2)

    should.equal(copy21.id, copy22.id)
    should.equal(copy21, copy22)

    should.equal(Object.getPrototypeOf(copy21), copy2)
  })

  it('nested fork', async(function*() {
    const transformCase = simpleHandlerBuilder(
    config => {
      const { transform } = config
      const doTransform = transform == 'uppercase' ?
        string => string.toUpperCase() :
        string => string.toLowerCase()

      return (args, text) =>
        doTransform(text)
    }, 'text', 'text')

    const filter = transformFilter(transformCase, 'out')

    const filter1 = filter.fork()
    const filter2 = filter.fork()

    should.not.equal(filter1.id, filter2.id)
    should.not.equal(filter1.transformComponent.id, 
      filter2.transformComponent.id)

    const greet = simpleHandler(
      (args, name) =>
        'Hello, ' + name, 
      'text', 'text')

    const greet1 = greet.fork()
      .middleware(filter1)

    const greet2  = greet.fork()
      .middleware(filter1)

    const greet3 = greet.fork()
      .middleware(filter2)

    const config = { transform: 'uppercase' }

    let handler = yield greet1.loadHandler(config)
    
    yield handler({}, 'John')
      .should.eventually.equal('HELLO, JOHN')

    config.transform = 'lowercase'

    handler = yield greet2.loadHandler(config)

    yield handler({}, 'Bob')
      .should.eventually.equal('HELLO, BOB')

    config.transform = 'lowercase'

    handler = yield greet3.loadHandler(config)

    yield handler({}, 'Alice')
      .should.eventually.equal('hello, alice')
  }))

  it('forked middlewares', async(function*() {
    const transformCase = simpleHandlerBuilder(
    config => {
      const { transform } = config
      const doTransform = transform == 'uppercase' ?
        string => string.toUpperCase() :
        string => string.toLowerCase()

      return (args, text) =>
        doTransform(text)
    }, 'text', 'text')

    const filter = transformFilter(transformCase, 'out')

    const greet = simpleHandler(
      (args, name) =>
        'Hello, ' + name, 
      'text', 'text')
    .middleware(filter)

    const forkTable1 = { }
    const forkTable2 = { }

    const greet1 = greet.fork(forkTable1)
    const uppercase = transformCase.fork(forkTable1)

    const greet2 = greet.fork(forkTable2)

    const config = { transform: 'uppercase' }
    
    let handler = yield uppercase.loadHandler(config)
    
    yield handler({}, 'Test')
      .should.eventually.equal('TEST')

    config.transform = 'lowercase'

    handler = yield greet1.loadHandler(config)
    
    yield handler({}, 'Alice')
      .should.eventually.equal('HELLO, ALICE')

    config.transform = 'lowercase'

    handler = yield greet2.loadHandler(config)
    
    yield handler({}, 'Bob')
      .should.eventually.equal('hello, bob')
  }))

  it('map test', async(function*() {
    const debugMiddleware = component => {
      const name = component.name || 'Unnamed Component'
      return configMiddleware(config => {
        if(!config.debugStack) {
          config.debugStack = []
        }

        config.debugStack.push(name)
      })
    }

    const debuggableComponent = (component, mapTable={}) => {
      const mapped = component.map(debuggableComponent, mapTable)
      
      if(mapped.middleware) {
        mapped.middleware(debugMiddleware(component))
      }

      return mapped
    }

    const upperCase = simpleHandlerBuilder(
      config => {
        const { debugStack } = config

        should.equal(debugStack.length, 3)
        debugStack[0].should.equal('Greet Handler')
        debugStack[1].should.equal('UpperCase Filter')
        debugStack[2].should.equal('UpperCase Handler')

        return (args, text) =>
          text.toUpperCase()
      }, 'text', 'text')
      .setName('UpperCase Handler')

    const filter = transformFilter(upperCase, 'out')
      .setName('UpperCase Filter')

    const greet = simpleHandlerBuilder(
      config => {
        const { debugStack } = config

        should.equal(debugStack.length, 2)
        debugStack[0].should.equal('Greet Handler')
        debugStack[1].should.equal('UpperCase Filter')

        return (args, name) =>
          'Hello, ' + name
      }, 'text', 'text')
    .middleware(filter)
    .setName('Greet Handler')

    const debugged = debuggableComponent(greet)

    const config = { }
    const handler = yield debugged.loadHandler(config)
  }))
})