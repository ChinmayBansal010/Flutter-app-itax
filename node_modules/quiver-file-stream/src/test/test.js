import fs from 'fs'

import {
  fileReadStream, fileWriteStream, tempFileReadStream,
  streamToFile, byteRangeFileStream,
  fileStreamable, tempFileStreamable, toFileStreamable
} from '../lib/file-stream'

import {
  streamToText, pipeStream
} from 'quiver-stream-util'

const { readFileSync } = fs

import { promisify, resolve } from 'quiver-promise'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const should = chai.should()

const readFile = promisify(fs.readFile)

const testFilePath = 'fixture/test-file.txt'
const testWritePath ='fixture/test-write.txt'
const testTempPath = 'fixture/test-temp.txt'

const expectedContent = readFileSync(testFilePath).toString()

describe('file stream test', () => {
  it('file read stream test', () =>
    fileReadStream(testFilePath).then(streamToText)
      .should.eventually.equal(expectedContent))

  it('file write stream test', () =>
    Promise.all([
      fileReadStream(testFilePath), 
      fileWriteStream(testWritePath)
    ]).then(([readStream, writeStream]) =>
      pipeStream(readStream, writeStream).then(() => {
        readFileSync(testWritePath).toString()
          .should.equal(expectedContent)
      })))

  it('file byte range stream test', () => {
    const start = 128
    const end = 512

    const expectedSlice = expectedContent.slice(start, end)
    
    return byteRangeFileStream(testFilePath, { start, end })
      .then(streamToText).should.eventually.equal(expectedSlice)
  })

  it('file streamable test', () => 
    fileStreamable(testFilePath).then(streamable => {
      should.exist(streamable.toStream)
      should.exist(streamable.toByteRangeStream)
      should.exist(streamable.toFilePath)

      streamable.toFilePath().should.eventually.equal(testFilePath)

      should.equal(streamable.reusable, true)
      should.equal(streamable.contentLength, expectedContent.length)
    }))

  it('temp file streamable test', async function() {
    const getTempPath = () => resolve(testTempPath)
    const readStream = await fileReadStream(testFilePath)

    const originalStreamable = {
      toStream: () => resolve(readStream)
    }

    const streamable = await toFileStreamable(originalStreamable, getTempPath)
    should.exist(streamable.toStream)
    should.exist(streamable.toByteRangeStream)
    should.exist(streamable.toFilePath)

    should.equal(streamable.reusable, false)
    should.equal(streamable.tempFile, true)
    should.equal(streamable.contentLength, expectedContent.length)

    streamable.toFilePath().should.eventually.equal(testTempPath)

    readFileSync(testTempPath).toString().should.equal(expectedContent)
  })
})
