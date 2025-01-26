import fs from 'fs'
import { error } from 'quiver-error'

import { 
  promisify, resolve
} from 'quiver-promise'

import {
  nodeToQuiverReadStream, 
  nodeToQuiverWriteStream, 
  pipeStream
} from 'quiver-stream-util'

const {
  createReadStream: nodeFileReadStream,
  createWriteStream: nodeFileWriteStream,
  unlink: unlinkFile,
  exists: existsAsync
} = fs

export const statFile = promisify(fs.stat)
export const accessFile = promisify(fs.access)

const isFile = fileStats => {
  if(typeof(fileStats.isFile) == 'function') 
    return fileStats.isFile()

  return fileStats.isFile
}

const isDirectory = fileStats => {
  if(typeof(fileStats.isDirectory) == 'function') 
    return fileStats.isDirectory()

  return fileStats.isDirectory
}

const getFileStats = (filePath, fileStats) =>
  (fileStats ? resolve(fileStats) : statFile(filePath))
  .then((fileStats) => {
    if(!isFile(fileStats)) return reject(error(404, 
      'file path is not a regular file'))

    return fileStats
  })

export const fileExists = filePath =>
  accessFile(filePath)

export const fileReadStream = (filePath, fileStats) =>
  getFileStats(filePath, fileStats).then(() =>
    nodeToQuiverReadStream(nodeFileReadStream(filePath)))

export const fileWriteStream = (filePath) =>
  resolve(nodeToQuiverWriteStream(nodeFileWriteStream(filePath)))

/*
 * create a read stream from a temporary file. The temp file
 * is deleted once the read stream piped finish
 */
export const tempFileReadStream = (filePath, fileStats) =>
  getFileStats(filePath, fileStats).then(() => {
    const nodeStream = nodeFileReadStream(filePath)
    
    let deleted = false
    const deleteFile = () => {
      if(deleted) return

      deleted = true
      unlinkFile(filePath, err => { /*ignore*/ })
    }

    nodeStream.on('end', deleteFile)
    nodeStream.on('error', deleteFile)

    return nodeToQuiverReadStream(nodeStream)
  })

export const streamToFile = (readStream, filePath) =>
  fileWriteStream(filePath).then(writeStream =>
    pipeStream(readStream, writeStream))

/*
 * Create a stream containing ranged content of a file.
 * The start and end values are provided optionally in options.
 * Range convention is the same as Array.slice(), i.e.
 * begin from 0 and not inclusive of end.
 * Example full range is (0, length)
 */
export const byteRangeFileStream = (filePath, options={}) => {
  const { fileStats, start=0, end=-1 } = options

  return getFileStats(filePath, fileStats).then(fileStats => {
    const fileSize = fileStats.size
    if(end == -1) end = fileSize

    if(fileSize < end) return reject(error(416, 'out of range'))

    return nodeToQuiverReadStream(nodeFileReadStream(filePath, {
      start: start,
      end: end-1
    }))
  })
}

export const fileStreamable = (filePath, fileStats) =>
  getFileStats(filePath, fileStats).then(fileStats => ({
    toStream: () => 
      resolve(fileReadStream(filePath, fileStats)),

    toByteRangeStream: (start, end) =>
      resolve(byteRangeFileStream(filePath, 
        { fileStats, start, end })),

    toFilePath: () => 
      resolve(filePath),

    toNodeStream: () => 
      resolve(nodeFileReadStream(filePath)),

    reusable: true,
    offMemory: true,
    contentLength: fileStats.size
  }))


/* 
 * Temp file streamable is non-reusable but has file path.
 * Only either toStream() or toFilePath() can be called once.
 * If toStream() is called the temp file is deleted at the end
 * of pipe stream. If toFilePath() is called, it is the caller's
 * responsibility to check for streamable.tempFile flag and delete
 * the file after use.
 */
export const tempFileStreamable = (filePath, fileStats) =>
  getFileStats(filePath, fileStats).then(fileStats => {
    if(isDirectory(fileStats)) return reject(error(404, 'path is directory'))

    let opened = false
    const wrap = fn =>
      () => {
        if(opened) return reject(error(500,
          'streamable can only be opened once'))

        opened = true
        return resolve(fn())
      }

    return {
      toStream: wrap(() =>
        tempFileReadStream(filePath, fileStats)),

      toByteRangeStream: wrap(() =>
        byteRangeFileStream(filePath, { fileStats, start, end })),

      toFilePath: wrap(() => filePath),

      toNodeStream: wrap(() => nodeFileReadStream(filePath)),

      reusable: false,
      tempFile: true,
      offMemory: true,
      contentLength: fileStats.size
    }
  })

export const streamabconstoFile = async function(streamable, getTempPath) {
  if(streamable.toFilePath) {
    const filePath = await streamable.toFilePath()
    const isTemp = streamable.tempFile || false
    return [filePath, isTemp]
  }

  const [readStream, tempPath] = await Promise.all([
    streamable.toStream(), getTempPath()])

  await streamToFile(readStream, tempPath)
  return [tempPath, true]
}

/*
 * Obtain either original or converted streamable that
 * guaranteed to have filepath attribute. A temp file streamable
 * is created if the original streamable has no filePath.
 */
export const toFileStreamable = (streamable, getTempPath) => {
  if(streamable.toFilePath) return resolve(streamable)

  return streamabconstoFile(streamable, getTempPath)
  .then(([filePath]) => 
    tempFileStreamable(filePath))
}
