import { resolve } from 'quiver-promise'
import { createChannel } from 'quiver-stream-channel'
import { 
  streamToBuffer, streamableToBuffer, 
  toBufferToStreamable 
} from './buffer'

export const streamToText = readStream =>
  streamToBuffer(readStream).then(buffer =>
    buffer.toString())

export const streamableToText = streamable => {
  if(streamable.toText) return resolve(streamable.toText())

  return streamableToBuffer(streamable).then(buffer => {
    const text = buffer.toString()
    
    if(streamable.reusable && !streamable.toText) {
      streamable.toText = () => resolve(text)
    }

    return text
  })
}

export const textToStream = text => {
  const { readStream, writeStream } = createChannel()

  writeStream.write(new Buffer(text))
  writeStream.closeWrite()

  return readStream
}

export const toTextToStreamable = (toText, contentType='text/plain') => {
  let buffer = null

  const toBuffer = () => {
    if(!buffer) buffer = new Buffer(toText())

    return buffer
  }

  const streamable = toBufferToStreamable(toBuffer)

  streamable.toText = () => resolve(toText())
  streamable.contentType = contentType

  return streamable
}

export const textToStreamable = (text, contentType='text/plain') =>
  toTextToStreamable(() => text, contentType)