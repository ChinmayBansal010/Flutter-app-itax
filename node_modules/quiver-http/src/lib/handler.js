import { async } from 'quiver-promise'
import { normalizeHttpHeader } from './normalize'

import { 
  RequestHead, ResponseHead
} from './header'

import {
  pipeStream,
  streamToStreamable,
  nodeToQuiverReadStream,
  nodeToQuiverWriteStream
} from 'quiver-stream-util'

export const streamToHttpHandler = streamHandler =>
  (requestHead, requestStreamable) => {
    const args = requestHead.args

    const contentType = requestHead.getHeader('content-type')
    const contentLength = requestHead.getHeader('content-length')

    if(contentType)
      requestStreamable.contentType = contentType

    if(contentLength)
      requestStreamable.contentLength = parseInt(contentLength)

    return streamHandler(args, requestStreamable)
    .then(resultStreamable => {
      const responseHead = new ResponseHead()

      const { 
        contentType, contentLength 
      } = resultStreamable

      if(contentType) {
        responseHead.setHeader('content-type', contentType)
      }

      if(typeof(contentLength) == 'number') {
        responseHead.setHeader('content-length', 
          (contentLength|0).toString())
      }

      return [responseHead, resultStreamable]
    })
  }

export const httpToNodeHandler = httpHandler =>
async(function*(request, response) {
  try {
    const requestHead = new RequestHead({
      httpVersion: request.httpVersion,
      headers: request.headers,
      method: request.method,
      url: request.url
    })

    requestHead.setArgs('clientAddress', 
      request.connection.remoteAddress)

    const requestStreamable = streamToStreamable(
      nodeToQuiverReadStream(request))

    const [responseHead, responseStreamable] = 
      yield httpHandler(requestHead, requestStreamable)


    const headers = responseHead.headers

    for(let key in headers) {
      const normalizedKey = normalizeHttpHeader(key, true)
      response.setHeader(normalizedKey, headers[key])
    }

    response.writeHead(responseHead.statusCode, 
      responseHead.statusMessage)

    if(headers['transfer-encoding'] == 'chunked'){
      response.chunkedEncoding = false
    }

    if(responseStreamable.toNodeStream) {
      const nodeRead = yield responseStreamable.toNodeStream()
      nodeRead.pipe(response)

    } else {
      const responseStream = yield responseStreamable.toStream()
      const responseWrite = nodeToQuiverWriteStream(response)

      pipeStream(responseStream, responseWrite)
    }

  } catch(err) {
    if(!response.headersSents) {
      const errorCode = err.errorCode || 500

      response.writeHead(errorCode, {
        'Content-Length': 0
      })
    }

    response.end()
  }
})