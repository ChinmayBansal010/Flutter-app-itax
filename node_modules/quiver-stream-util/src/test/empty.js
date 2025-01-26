import chai from 'chai'
import { emptyReadStream, emptyWriteStream } from '../lib/empty'

const should = chai.should()

describe('empty stream test', () => {
  it('test empty read stream', () => {
    const readStream = emptyReadStream()

    should.exist(readStream.isClosed())
    
    return readStream.read().then(({closed, data}) => {
      should.exist(closed)
      should.not.exist(data)
    })
  })

  it('test empty write stream', () => {
    const writeStream = emptyWriteStream()
    
    writeStream.write('ignored data')
    should.exist(writeStream.isClosed())

    return writeStream.prepareWrite().then(({closed}) => {
      should.exist(closed)
    })
  })
})