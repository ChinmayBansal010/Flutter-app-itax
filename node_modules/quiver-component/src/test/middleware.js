import { async, resolve, reject } from 'quiver-promise'

import {
  simpleHandler, simpleHandlerBuilder, 
} from '../lib/export.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

describe('middleware test', () => {
  it('input handler', async(function*() {
    const uppercase = simpleHandler(
      (args, input) =>  input.toUpperCase() + '!', 
      'text', 'text')

    const main = simpleHandlerBuilder(
      config => {
        const inHandler = config.inHandler
        should.exist(inHandler)

        return async(function*(args, input) {
          const result = yield inHandler(args, input)
          
          return {
            status: 'ok',
            result
          }
        })
      }, 'text', 'json')
    .inputHandler(uppercase, 'inHandler')

    const handler = yield main.loadHandler({})
    const json = yield handler({}, 'hello')

    json.status.should.equal('ok')
    json.result.should.equal('HELLO!')
  }))

  it('config override', async(function*() {
    const main = simpleHandlerBuilder(
      config => {
        config.foo.should.equal('bar')

        return args => 'hello'
      }, 'void', 'text')
    .configOverride({
      foo: 'bar'
    })

    const config = {
      foo: 'foo'
    }

    yield main.loadHandler(config)
  }))

  it('config alias', async(function*() {
    const main = simpleHandlerBuilder(
      config => {
        config.foo.should.equal('bar')

        return args => 'hello'
      }, 'void', 'text')
    .configAlias({
      foo: 'bar'
    })

    const config = {
      bar: 'bar'
    }

    yield main.loadHandler(config)
  }))
})