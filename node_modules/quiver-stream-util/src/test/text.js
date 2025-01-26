import { createChannel } from 'quiver-stream-channel'
import {
  streamToText
} from '../lib/stream-util'

const chai = require('chai')
const should = chai.should()

const testString = '世界你好'
const testBuffer = new Buffer(testString)
const buffer1 = testBuffer.slice(0, 5)
const buffer2 = testBuffer.slice(5, 10)
const buffer3 = testBuffer.slice(10, 12)

describe('unicode text test', function() {
  it('buffer to string then concat should not equal original', () => {
    const result = '' + buffer1 + '' + buffer2 + '' + buffer3
    result.should.not.equal(testString) 
  })

  it('buffer concat then to string should equal original', () => {
    const buffer = Buffer.concat([buffer1, buffer2, buffer3])
    const result = ''+buffer
    result.should.equal(testString)
  })

  it('stream to text should equal original', () => {
    const { readStream, writeStream } = createChannel()

    writeStream.write(buffer1)
    writeStream.write(buffer2)
    writeStream.write(buffer3)
    writeStream.closeWrite()

    return streamToText(readStream).then(text => 
      text.should.equal(testString))
  })
})