import { async } from 'quiver-promise'

import { 
  simpleToStreamHandler, 
  streamToSimpleHandler 
} from '../lib/simple-handler.js'

import {
  textToStreamable, streamableToText, 
  textToStream, streamToText,
  emptyStreamable
} from 'quiver-stream-util'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

describe('simple handler test', () => {
  it('json text convert', () => {
    const simpleHandler = (args, json) => {
      json.content.should.equal('hello world')

      return 'Hello World!'
    }

    const handler = simpleToStreamHandler(simpleHandler, 'json', 'text')
    const inStream = textToStreamable('{ "content": "hello world" }')

    return handler({}, inStream).then(streamableToText)
      .should.eventually.equal('Hello World!')
  })

  it('void stream convert', () => {
    const simpleHandler = (args, input) => {
      should.not.exist(input)
      return textToStream('hello world')
    }

    const handler = simpleToStreamHandler(simpleHandler, 'void', 'stream')

    return handler({}, emptyStreamable()).then(streamableToText)
      .should.eventually.equal('hello world')
  })

  it('void html convert', async function() {
    const html = '<b>Hello World</b>'

    const simpleHandler = args => html
    
    const handler = simpleToStreamHandler(simpleHandler, 
      'void', 'html')
    
    const resultStreamable = await handler(
      {}, emptyStreamable())

    resultStreamable.contentType.should.equal('text/html')

    await streamableToText(resultStreamable)
      .should.eventually.equal(html)
  })

  it('stream void convert', () => {
    const simpleHandler = (args, readStream) =>
      streamToText(readStream).then(text => {
        text.should.equal('hello world')
        return null
      })


    const handler = simpleToStreamHandler(simpleHandler, 'stream', 'void')
    const inStream = textToStreamable('hello world')

    return handler({}, inStream).then(streamableToText)
      .should.eventually.equal('')
  })

  it('void json stream handler', () => {
    const streamHandler = (args, streamable) =>
      streamableToText(streamable).then(text => {
        text.should.equal('')

        return textToStreamable('{ "result": "hello world" }')
      })

    const handler = streamToSimpleHandler(streamHandler, 'void', 'json')

    return handler({}).then(json => {
      json.result.should.equal('hello world')
    })
  })

  it('stream void stream handler', () => {
    const streamHandler = (args, streamable) =>
      streamableToText(streamable).then(text => {
        text.should.equal('hello world')
        return emptyStreamable()
      })


    const handler = streamToSimpleHandler(streamHandler, 'stream', 'void')

    const inStream = textToStream('hello world')
    return handler({}, inStream).then(result =>
      should.not.exist(result))
  })
})
