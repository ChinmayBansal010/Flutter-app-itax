import { 
  RequestHead, ResponseHead,
  streamToHttpHandler
} from '../lib/http'

import {
  normalizeTable, normalizeHttpHeader
} from '../lib/normalize'

import {
  streamableToText, textToStreamable
} from 'quiver-stream-util'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()
const expect = chai.expect

describe('http header test', () => {
  it('request head test 1', () => {
    const requestHead = new RequestHead()

    requestHead.httpVersion.should.equal('1.1')
    requestHead.method.should.equal('GET')
    requestHead.url.should.equal('/')
    requestHead.path.should.equal('/')
    requestHead.queryString.should.equal('')
  })

  it('request head test 2', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar'
    })

    requestHead.path.should.equal('/api/path')
    requestHead.queryString.should.equal('foo=bar')
    requestHead.query.foo.should.equal('bar')
  })

  it('request head test 3', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar'
    })

    requestHead.setQuery('foo', 'baz')

    requestHead.url.should.equal('/api/path?foo=baz')
    requestHead.path.should.equal('/api/path')
    requestHead.queryString.should.equal('foo=baz')
    requestHead.query.foo.should.equal('baz')
  })

  it('request head test 3', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar'
    })

    requestHead.path = '/new-path'


    requestHead.url.should.equal('/new-path?foo=bar')
    requestHead.path.should.equal('/new-path')
    requestHead.queryString.should.equal('foo=bar')
    requestHead.query.foo.should.equal('bar')
  })

  it('request head test 4', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar'
    })

    requestHead.path.should.equal('/api/path')
    requestHead.queryString.should.equal('foo=bar')
    requestHead.query.foo.should.equal('bar')

    requestHead.url = '/new-path?foo=baz'

    requestHead.url.should.equal('/new-path?foo=baz')
    requestHead.path.should.equal('/new-path')
    requestHead.queryString.should.equal('foo=baz')
    requestHead.query.foo.should.equal('baz')
  })

  it('request head test 5', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar'
    })

    requestHead.path.should.equal('/api/path')
    requestHead.queryString.should.equal('foo=bar')
    requestHead.query.foo.should.equal('bar')

    requestHead.queryString = 'bar=foo'
    requestHead.setQuery('baz', 'bar')
    requestHead.url = '/new-path?foo=baz'

    requestHead.url.should.equal('/new-path?foo=baz')
    requestHead.path.should.equal('/new-path')
    requestHead.queryString.should.equal('foo=baz')
    requestHead.query.foo.should.equal('baz')
  })

  it('request head test 6', () => {
    const requestHead = new RequestHead({
      url: 'http://localhost:8080/api/path?foo=bar'
    })

    requestHead.protocol.should.equal('http:')
    requestHead.hostname.should.equal('localhost')
    requestHead.port.should.equal('8080')
    requestHead.path.should.equal('/api/path')
    requestHead.queryString.should.equal('foo=bar')
    requestHead.query.foo.should.equal('bar')
  })

  it('request head copy fields test', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar',
      headers: {
        'X-Foo': 'Bar'
      }
    })

    requestHead.getHeader('X-Foo').should.equal('Bar')
    requestHead.getHeader('x-FOO').should.equal('Bar')

    const { headers } = requestHead
    headers['x-foo'].should.equal('Bar')

    headers['x-foo'] = 'BAZ'

    requestHead.getHeader('X-Foo').should.equal('BAZ')
  })

  it('request head args test', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar',
      headers: {
        'X-Foo': 'Bar'
      }
    })

    requestHead.setArgs('foo', 'baz')

    const { args } = requestHead

    args.path.should.equal('/api/path')
    args.foo.should.equal('baz')

    args.requestHead.query.foo.should.equal('bar')
  })

  it('request head error test', () => {
    const requestHead = new RequestHead({
      url: '/api/path?foo=bar'
    })

    expect(() => 
      requestHead.setHeader('Foo:', ''))
    .to.throw()
  })

  it('response head test', () => {
    const responseHead = new ResponseHead()

    responseHead.statusCode.should.equal(200)
    responseHead.statusMessage.should.equal('OK')

    responseHead.statusCode = 404
    responseHead.statusMessage = 'Not Found'

    responseHead.statusCode.should.equal(404)
    responseHead.statusMessage.should.equal('Not Found')

    expect(() => 
      responseHead.statusCode = 'string')
    .to.throw()

    expect(() => 
      responseHead.statusMessage = 'New Line\n')
    .to.throw()
  })

  it('handler convert test', () => {
    const streamHandler = (args, streamable) => {
      args.path.should.equal('/api/hello')
      args.requestHead.method.should.equal('POST')

      streamable.contentType.should.equal('text/html')

      args.requestHead.getHeader('content-type')
        .should.equal('text/html')

      return streamableToText(streamable).then(
        (body) => {
          body.should.equal('Hello')
          return textToStreamable('Good Bye')
        })
    }

    const httpHandler = streamToHttpHandler(streamHandler)

    const requestHead = new RequestHead({
      method: 'POST',
      url: '/api/hello?foo=bar'
    })
    .setHeader('content-type', 'text/html')

    return httpHandler(requestHead, textToStreamable('Hello'))
    .then(([responseHead, responseStreamable]) => {
      responseHead.statusCode.should.equal(200)
      responseHead.statusMessage.should.equal('OK')

      responseHead.getHeader('content-type')
        .should.equal('text/plain')

      responseHead.getHeader('content-length')
        .should.equal('8')

      return streamableToText(responseStreamable)
        .should.eventually.equal('Good Bye')
    })
  })

  it('normalize header test', () => {
    normalizeTable['content-type']
      .should.equal('Content-Type')

    normalizeHttpHeader('content-type')
      .should.equal('Content-Type')

    should.not.exist(normalizeTable['x-custom-header'])

    normalizeHttpHeader('x-custom-header')
      .should.equal('X-Custom-Header')

    should.not.exist(normalizeTable['x-custom-header'])

    normalizeHttpHeader('x-custom-header', true)
      .should.equal('X-Custom-Header')

    normalizeTable['x-custom-header']
      .should.equal('X-Custom-Header')

    normalizeHttpHeader('x-custom-header')
      .should.equal('X-Custom-Header')
  })
})