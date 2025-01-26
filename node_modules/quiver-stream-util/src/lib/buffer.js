import { resolve } from 'quiver-promise'
import { createChannel } from 'quiver-stream-channel'
import { 
  streamToBuffers, streamableToBuffers 
} from './buffers'

const nodeBuffers = buffers =>
  buffers.map(buffer =>
    (buffer instanceof Buffer) ? buffer : new Buffer(buffer))

const buffersToBuffer = buffers =>
  Buffer.concat(nodeBuffers(buffers))

export const streamToBuffer = readStream =>
  streamToBuffers(readStream).then(buffersToBuffer)

export const streamableToBuffer = streamable => {
  if(streamable.toBuffer) return resolve(streamable.toBuffer())

  return streamableToBuffers(streamable).then(buffersToBuffer)
    .then(buffer => {
      if(streamable.reusable && !streamable.toBuffer) {
        streamable.toBuffer = () => resolve(buffer)
      }

      return buffer
    })
}

export const bufferToStream = buffer => {
  if(!Buffer.isBuffer(buffer)) 
    buffer = new Buffer(buffer)
  
  const { readStream, writeStream } = createChannel()

  writeStream.write(buffer)
  writeStream.closeWrite(null)

  return readStream
}

export const toBufferToStreamable = (toBuffer) => ({
  reusable: true,
  get contentLength() {
    return toBuffer().length
  },
  toBuffer: () => resolve(toBuffer()),
  toBuffers: () => resolve([toBuffer()]),
  toStream: () => resolve(bufferToStream(toBuffer()))
})

export const bufferToStreamable = buffer => {
  if(!Buffer.isBuffer(buffer)) 
    buffer = new Buffer(buffer)

  return toBufferToStreamable(() => buffer)
}
