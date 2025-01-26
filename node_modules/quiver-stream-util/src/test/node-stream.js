import fs from 'fs'

import { 
  nodeToQuiverReadStream, nodeToQuiverWriteStream, streamToText
} from '../lib/stream-util.js'

const { 
  readFileSync, createReadStream, createWriteStream
} = fs

const sampleFile = 'fixture/sample.txt'
const tempWrite = 'fixture/temp.txt'
const expectedContent = readFileSync(sampleFile).toString()

const chunkString = (content, count) => {
  const length = content.length
  const interval = (length / count) | 0
  const chunks = []

  for(let i=0; i<=count; i++) {
    const start = interval*i
    const end = interval*(i+1)

    if(start >= length) break
    if(end > length) end == length

    chunks.push(content.slice(start, end))
  }

  return chunks
}

const writeChunks = chunkString(expectedContent, 5)

describe('node stream convert test', () => {
  it('should read the right content', () => {
    const nodeStream = createReadStream(sampleFile)
    const readStream = nodeToQuiverReadStream(nodeStream)

    return streamToText(readStream, text =>
      text.should.equal(expectedContent))
  })

  it('test write chunks correctness', () => 
    writeChunks.join('').should.equal(expectedContent))

  it('should write the right content', callback => {
    const nodeStream = createWriteStream(tempWrite)
    const writeStream = nodeToQuiverWriteStream(nodeStream)

    writeChunks.forEach(data =>
      writeStream.write(data))

    writeStream.closeWrite()

    nodeStream.on('finish', () => {
      const result = readFileSync(tempWrite).toString()
      result.should.equal(expectedContent)
      callback()
    })
  })
})