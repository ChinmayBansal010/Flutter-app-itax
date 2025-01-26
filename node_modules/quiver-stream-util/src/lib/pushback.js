import { resolve } from 'quiver-promise'

export const pushbackStream = (readStream, buffers=[]) => {
  if(readStream.pushback) {
    readStream.pushback(buffers)
    return readStream
  }

  const newReadStream = Object.create(readStream)

  const doRead = () => {
    if(buffers.length == 0) {
      return readStream.read()
    } else {
      return resolve({ data: buffers.shift() })
    }
  }

  newReadStream.read = doRead

  newReadStream.closeRead = err => {
    buffers = []
    return readStream.closeRead(err)
  }

  newReadStream.pushback = moreBuffers => {
    buffers = moreBuffers.concat(buffers)
  }

  newReadStream.peek = () => {
    if(buffers[0]) 
      return resolve({ data: buffers[0] })

    return doRead(({ closed, data }) => {
      if(closed) return { closed }

      buffers.push(data)
      return { data }
    })
  }

  return newReadStream
}