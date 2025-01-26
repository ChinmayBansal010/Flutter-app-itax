import { async, resolve } from 'quiver-promise'

import { 
  RequestHead, ResponseHead 
} from 'quiver-http'

import { 
  streamableToText, textToStreamable 
} from 'quiver-stream-util'

import {
  streamHandler, simpleHandler, httpHandlerBuilder
} from '../lib/export.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

describe('handler test', () => {
  it('stream handler', () => {
    const main = streamHandler(
      (args, streamable) =>
        streamableToText(streamable).then(input => {
          input.should.equal('hello')
          return textToStreamable('goodbye')
        }))

    return main.toHandleableBuilder()({})
      .then(handleable => {
        const handler = handleable.streamHandler
        const input = textToStreamable('hello')
        
        return handler({}, input).then(streamableToText)
          .should.eventually.equal('goodbye')
      })
  })

  it('simple handler', () => {
    const main = simpleHandler(
      (args, input) => {
        input.should.equal('hello')
        return '<b>goodbye</b>'
      }, 'text', 'html')

    return main.loadHandler({}).then(handler =>
      handler({}, 'hello').should.eventually.equal('<b>goodbye</b>'))
  })

  it('http builder', async(function*() {
    const main = httpHandlerBuilder(
      config => {
        const greet = config.greet || 'hi'
        config.modified = true

        return async(function*(requestHead, streamable) {
          const input = yield streamableToText(streamable)
          input.should.equal('hello')

          return [
            new ResponseHead(),
            textToStreamable(greet)
          ]
        })
      })

    const config = {
      greet: 'goodbye'
    }

    const handleable = yield main.loadHandleable(config)
    should.not.exist(config.modified)

    const handler = handleable.httpHandler
    should.exist(handler)

    const input = textToStreamable('hello')
    const [responseHead, responseStreamable] = 
      yield handler(new RequestHead(), input)

    responseHead.statusCode.should.equal(200)

    yield streamableToText(responseStreamable)
      .should.eventually.equal('goodbye')
  }))
})