import http from 'http'

import { 
  RequestHead, ResponseHead,
  httpToNodeHandler,
  subrequest, getRequest,
  startServer
} from '../lib/http'

const { createServer } = http

import { async, timeout, reject } from 'quiver-promise'
import { error } from 'quiver-error'

import {
  streamableToText, textToStreamable,
  streamToText, textToStream
} from 'quiver-stream-util'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()
const expect = chai.expect

let testPort = 8100

describe('node handler test', () => {
  it('get request test', async(function*() {
    const handler = async(function*(requestHead, streamable) {
      requestHead.method.should.equal('GET')
      requestHead.path.should.equal('/get-path')
      requestHead.query.foo.should.equal('bar')

      yield streamableToText(streamable)
        .should.eventually.equal('')

      return [new ResponseHead(), textToStreamable('Hello World')]
    })

    const port = testPort++
    const server = createServer(httpToNodeHandler(handler))
      .listen(port)

    const [responseHead, responseStream] = yield getRequest(
      'http://localhost:' + port + '/get-path?foo=bar')

    responseHead.statusCode.should.equal(200)
    responseHead.statusMessage.should.equal('OK')

    yield streamToText(responseStream)
      .should.eventually.equal('Hello World')

    server.close()
  }))

  it('post request test', async(function*() {
    const handler = async(function*(requestHead, streamable) {
      requestHead.method.should.equal('POST')
      requestHead.path.should.equal('/post-path')
      requestHead.query.foo.should.equal('bar')
      requestHead.getHeader('Content-Type').should.equal('text/plain')

      yield streamableToText(streamable)
        .should.eventually.equal('Hello')

      return [new ResponseHead(), textToStreamable('Good Bye')]
    })

    const port = testPort++
    const server = createServer(httpToNodeHandler(handler))
      .listen(port)

    const requestHead = new RequestHead({
      url: 'http://localhost:' + port + '/post-path?foo=bar',
      method: 'post',
      headers: {
        'content-type': 'text/plain'
      }
    })

    const [responseHead, responseStream] = yield subrequest(
      requestHead, textToStream('Hello'))

    responseHead.statusCode.should.equal(200)
    responseHead.statusMessage.should.equal('OK')

    yield streamToText(responseStream)
      .should.eventually.equal('Good Bye')

    server.close()
  }))

  it('error test', async(function*() {
    const handler = (requestHead, streamable) =>
      reject(error(404, 'Not Found'))

    const port = testPort++
    const server = createServer(httpToNodeHandler(handler))
      .listen(port)

    const [responseHead, responseStream] = yield getRequest(
      'http://localhost:' + port + '/')

    responseHead.statusCode.should.equal(404)
    responseHead.statusMessage.should.equal('Not Found')

    yield streamToText(responseStream)
      .should.eventually.equal('')

    server.close()
  }))

  it('server test', async(function*() {
    const handler = async(function*(args, streamable) {
      const { requestHead } = args
      
      args.path.should.equal('/get-path')

      requestHead.method.should.equal('GET')
      requestHead.query.foo.should.equal('bar')

      yield streamableToText(streamable)
        .should.eventually.equal('')

      return textToStreamable('Hello World')
    })

    const component = {
      isHandlerComponent: true,
      toHandleableBuilder: () =>
        config => ({
          streamHandler: handler
        })
    }

    const port = testPort++
    const config = {
      serverListen: port
    }
    const server = yield startServer(component, config)

    const [responseHead, responseStream] = yield getRequest(
      'http://localhost:' + port + '/get-path?foo=bar')

    responseHead.statusCode.should.equal(200)
    responseHead.statusMessage.should.equal('OK')

    yield streamToText(responseStream)
      .should.eventually.equal('Hello World')

    server.close()
  }))
})