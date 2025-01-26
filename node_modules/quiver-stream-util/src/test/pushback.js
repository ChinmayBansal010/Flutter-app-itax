import {
  streamToText,
  buffersToStream,
  pushbackStream
} from '../lib/stream-util'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

describe('stream pushback test', () => {
  it('should emit pushed back buffers first', async function() {
    const testBuffers = ['foo ', 'bar']
    const pushbackBuffers = ['before1 ', 'before2 ']

    let readStream = buffersToStream(testBuffers)
    readStream = pushbackStream(readStream, pushbackBuffers)

    let { data } = await readStream.peek()
    data.should.equal('before1 ')

    ;({ data } = await readStream.peek())
    data.should.equal('before1 ')

    await streamToText(readStream).should.eventually.equal(
      'before1 before2 foo bar')
  })

  it('nested stream pushback test', async function() {
    const testBuffers = ['six ', 'seven']
    let readStream = buffersToStream(testBuffers)

    readStream = pushbackStream(readStream, ['four ', 'five '])
    readStream = pushbackStream(readStream, ['three '])
    readStream = pushbackStream(readStream, ['one ', 'two '])

    await streamToText(readStream).should.eventually.equal(
      'one two three four five six seven')
  })
})
