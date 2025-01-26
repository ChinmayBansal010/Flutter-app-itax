import http from 'http'

import { 
  RequestHead, ResponseHead
} from './header'

import {
  pipeStream,
  streamToStreamable,
  nodeToQuiverReadStream,
  nodeToQuiverWriteStream
} from 'quiver-stream-util'

export const requestHeadToOptions = requestHead => {
  const {
    auth,
    hostname,
    port,
    method,
    path,
    queryString,
    headers
  } = requestHead

  return {
    auth,
    hostname,
    port,
    method,
    path: path + '?' + queryString,
    headers
  }
}

export const nodeToQuiverResponse = response => {
  const responseHead = new ResponseHead(response)

  const responseStream = nodeToQuiverReadStream(response)

  return [responseHead, responseStream]
}

export const subrequest = (requestHead, requestStream) =>
  new Promise((resolve, reject) => {
    const request = http.request(
      requestHeadToOptions(requestHead), 
      response =>
        resolve(nodeToQuiverResponse(response)))
    .on('error', reject)

    pipeStream(requestStream, 
      nodeToQuiverWriteStream(request))
  })

export const getRequest = (url, requestStream) =>
  new Promise((resolve, reject) => {
    http.get(url, response =>
        resolve(nodeToQuiverResponse(response)))
    .on('error', reject)
  })
