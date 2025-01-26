import { async, resolve, reject } from 'quiver-promise'
import { streamToSimpleHandler } from 'quiver-simple-handler'
import { 
  streamableToText, textToStreamable, 
  emptyStreamable, jsonToStreamable
} from 'quiver-stream-util'

import { RequestHead } from 'quiver-http'

import {
  simpleHandler, simpleHandlerBuilder, 
  handleable as makeHandleable,
  streamFilter, httpFilter, transformFilter,
  argsFilter, argsBuilderFilter, errorFilter,
} from '../lib/export.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

const uppercaseStream = streamable =>
  streamableToText(streamable).then(text => {
    const newText = text.toUpperCase() + '!'
    return textToStreamable(newText)
  })

describe('filter test', () => {
  it('simple handler', async(function*() {
    const filter = streamFilter(
      (config, handler) =>
        (args, streamable) =>
          uppercaseStream(streamable).then(streamable =>
            handler(args, streamable).then(uppercaseStream)))

    const main = simpleHandler(
      (args, input) => {
        input.should.equal('HELLO!')
        return 'goodbye'
      }, 'text', 'text')
    .middleware(filter)

    const handler = yield main.loadHandler({})
    
    yield handler({}, 'hello')
      .should.eventually.equal('GOODBYE!')
  }))

  it('transform filter', async(function*() {
    const uppercase = simpleHandler(
      (args, input) =>
        input.toUpperCase() + '!', 
      'text', 'text')

    const filter = transformFilter(uppercase, 'inout')

    const main = simpleHandler(
      (args, input) => {
        input.should.equal('HELLO!')
        return 'goodbye'
      }, 'text', 'text')
    .middleware(filter)

    const handler = yield main.loadHandler({})
    
    yield handler({}, 'hello')
      .should.eventually.equal('GOODBYE!')
  }))

  it('args filter', async(function*() {
    const main = simpleHandler(
      args => {
        args.foo.should.equal('bar')
        return 'foo'
      }, 'void', 'text')
    .argsFilter(args => {
      args.foo = 'bar'
    })

    const handler = yield main.loadHandler({})

    yield handler({}).should.eventually.equal('foo')
  }))

  it('args builder filter', async(function*() {
    const filter = argsBuilderFilter(
      config => {
        should.not.exist(config.handlerModified)
        config.filterModified = true

        const fooValue = config.fooValue

        return args => {
          args.foo = fooValue
        }
      })

    const main = simpleHandlerBuilder(
      config => {
        should.not.exist(config.filterModified)
        config.handlerModified = true

        return args => {
          args.foo.should.equal('bar')
          return 'foo'
        }
      }, 'void', 'text')
    .middleware(filter)

    const config = { fooValue: 'bar' }
    const handler = yield main.loadHandler(config)

    yield handler({}).should.eventually.equal('foo')
  }))

  it('error filter', async(function*() {
    const filter = errorFilter(
      err => textToStreamable('error caught from filter'))

    const main = simpleHandler(
      args => {
        throw new Error('error in handler')
      }, 'void', 'text')
    .middleware(filter)

    const handler = yield main.loadHandler({})

    yield handler({}).should.eventually.equal(
      'error caught from filter')
  }))

  it('stream handler on http filter', async(function*() {
    const filter = httpFilter(
      (config, handler) => handler)

    const main = simpleHandler(
      args => 'Hello World',
      'void', 'text')
    .middleware(filter)

    const handleable = yield main.loadHandleable({})

    const {
      streamHandler,
      httpHandler
    } = handleable

    should.not.exist(streamHandler)
    should.exist(httpHandler)

    const [
      responseHead, responseStreamable
    ] = yield httpHandler(new RequestHead(), emptyStreamable())

    responseHead.statusCode.should.equal(200)

    yield streamableToText(responseStreamable)
      .should.eventually.equal('Hello World')
  }))
})