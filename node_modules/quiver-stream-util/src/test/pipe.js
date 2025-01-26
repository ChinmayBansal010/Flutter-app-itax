import { 
  pipeStream, createChannel, 
  buffersToStream, streamToText
} from '../lib/stream-util.js'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

const buffers = ['one ', 'two ', 'three']

describe('pipestream test', () => {
  it('should pipe successfully', () => {
    const sourceStream = buffersToStream(buffers)
    const { writeStream, readStream } = createChannel()

    const p1 = pipeStream(sourceStream, writeStream)

    const p2 = streamToText(readStream).then(text =>
      text.should.equal('one two three'))

    return Promise.all([p1, p2])
  })

  it('should write fail', () => {
    const { writeStream: writeStream1, 
      readStream: readStream1 } = createChannel()
    const { writeStream: writeStream2, 
      readStream: readStream2 } = createChannel()

    const p1 = pipeStream(readStream1, writeStream2).should.be.rejected

    const p2 = readStream2.read().then(({closed, data}) => {
      data.should.equal('one')
      readStream2.closeRead(new Error())
    })

    writeStream1.write('one')
    const p3 = writeStream1.prepareWrite().should.be.rejected

    return Promise.all([p1, p2, p3])
  })

  it('should read fail', () => {
    const { writeStream: writeStream1, 
      readStream: readStream1 } = createChannel()
    const { writeStream: writeStream2, 
      readStream: readStream2 } = createChannel()

    const p1 = pipeStream(readStream1, writeStream2).should.be.rejected

    writeStream1.write('one')
    writeStream1.closeWrite(new Error())

    const p2 = readStream2.read().then(({closed, data}) => {
      data.should.equal('one')
      
      return readStream2.read().should.be.rejected
    })

    return Promise.all([p1, p2])
  })
})