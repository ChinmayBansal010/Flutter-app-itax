import { error } from 'quiver-error'
import { resolve } from 'quiver-promise'
import { createChannel } from 'quiver-stream-channel'
import { buffersToStream } from './buffers'

export const closeStreamable = streamable => {
  if(streamable.reusable) return resolve()

  return streamable.toStream()
  .then(readStream => 
    readStream.closeRead())
}

export const streamToStreamable = readStream => {
  let opened = false

  return {
    reusable: false,
    toStream: () => {
      if(opened) return reject(error(500,
        'streamable can only be opened once'))

      opened = true
      return resolve(readStream)
    }
  }
}

export const reuseStream = readStream => {
  const streamable = {
    reusable: true
  }

  const buffers = []
  const pendingWrites = []

  streamable.toStream = () => {
    const { readStream, writeStream } = createChannel()
    buffers.forEach(buffer => writeStream.write(buffer))
    pendingWrites.push(writeStream) 
    return resolve(readStream)
  }

  const doPipe = () => {
    readStream.read().then(({ closed, data }) => {
      if(closed) {
        pendingWrites.forEach(writeStream => 
          writeStream.closeWrite())

        const allBuffers = buffers
        streamable.toStream = () => 
          resolve(buffersToStream(allBuffers))

      } else {
        buffers.push(data)

        pendingWrites.forEach(writeStream =>
          writeStream.write(data))

        doPipe()
      }

    }, err => {
      pendingWrites.forEach(writeStream => 
        writeStream.closeWrite(err))
      
      streamable.toStream = () => reject(err)
    })
  }

  doPipe()

  return streamable
}

export const reuseStreamable = streamable => {
  if(streamable.reusable) return resolve(streamable)

  return streamable.toStream().then(reuseStream)
}

export const unreuseStreamable = streamable => {
  if(!streamable.reusable) return streamable

  const oldToStream = streamable.toStream

  streamable.reusable = false

  let opened = false
  streamable.toStream = () => {
    if(opened) return rreject(error(500,
        'streamable can only be opened once'))

    opened = true
    return oldToStream()
  }

  return streamable
}