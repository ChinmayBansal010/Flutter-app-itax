import chai from 'chai'

import { 
  streamableToText, buffersToStreamable, reuseStream, streamToBuffers
} from '../lib/stream-util'

import { promiseChain, resolve } from 'quiver-promise'

const should = chai.should()

const testBuffers = [ 'foo', 'bar', 'baz' ]

describe('basic buffer test', () => {
  const streamable = buffersToStreamable(testBuffers)

  it('should convert buffers to stream', async function() {
    const readStream = await streamable.toStream()

    let {closed, data} = await readStream.read()
    data.should.equal(testBuffers[0])

    ;({closed, data} = await readStream.read())
    data.should.equal(testBuffers[1])

    ;({closed, data} = await readStream.read())
    data.should.equal(testBuffers[2])

    ;({closed, data} = await readStream.read())
    should.exist(closed)
  })

  it('should be convertible to string', () =>
    streamableToText(streamable).then(text =>
      text.should.equal('foobarbaz')))

  it('convert buffers stream into reusable streamable', async function() {
    const streamable2 = await streamable.toStream().then(reuseStream)

    const buffers = await streamable2.toStream().then(streamToBuffers)
    buffers.should.eql(testBuffers)

    // call toStream() again
    const buffers2 = await streamable2.toStream().then(streamToBuffers)
    buffers2.should.eql(testBuffers)
  })
})
