import { error } from 'quiver-error'
import { resolve, reject } from 'quiver-promise'
import { createChannel } from 'quiver-stream-channel'

const noop = () => { }

export const nodeReadToStreamable = nodeRead => {
  let opened = false

  const toStream = () => {
    if(opened) return reject(error(500, 
      'streamable can only be opened once'))

    opened = true
    return resolve(nodeToQuiverReadStream(nodeRead))
  }

  const toNodeStream = () => {
    if(opened) return reject(error(500, 
      'streamable can only be opened once'))

    opened = true
    return resolve(nodeRead)
  }

  return {
    reusable: false,
    toStream,
    toNodeStream
  }
}

export const nodeToQuiverReadStream = nodeRead => {
  const { readStream, writeStream } = createChannel()

  let ended = false

  nodeRead.on('end', () => {
    if(ended) return
    ended = true

    writeStream.closeWrite()
  })

  nodeRead.on('error', err => {
    if(ended) return
    ended = true

    writeStream.closeWrite(err)
  })

  const doRead = (callback) => {
    if(ended) return

    const data = nodeRead.read()
    if(data) return callback(data)

    nodeRead.once('readable', () => doRead(callback))
  }

  const doPipe = () =>
    writeStream.prepareWrite().then(({closed}) => {
      // force the node read stream into flowing mode 
      // because there is no way to cancel a node read stream?!
      if(closed) return nodeRead.resume()

      doRead(data => {
        writeStream.write(data)
        doPipe()
      })
    })

  doPipe()

  return readStream
}

export const nodeToQuiverWriteStream = nodeWrite => {
  const { readStream, writeStream } = createChannel()

  nodeWrite.on('error', err =>
    readStream.closeRead(err))

  const doPipe = () =>
    readStream.read().then(({closed, data}) => {
      if(closed) return nodeWrite.end()

      const ready = nodeWrite.write(data)
      if(ready) return doPipe()
      
      nodeWrite.once('drain', doPipe)
    }, err => nodeWrite.end())

  doPipe()
  
  return writeStream
}