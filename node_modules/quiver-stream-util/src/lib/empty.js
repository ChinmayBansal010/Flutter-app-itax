import { resolve } from 'quiver-promise'

export const emptyReadStream = () => ({
  read: () => resolve({closed: true}),
  closeRead: err => { },
  isClosed: () => ({})
})

export const emptyWriteStream = closeErr => ({
  prepareWrite: () => resolve({closed: true}),
  write: data => { },
  closeWrite: err => { },
  isClosed: () => ({})
})

export const emptyStreamable = closeErr => ({
  reusable: true,
  contentLength: 0,
  toStream: () => resolve(emptyReadStream(closeErr)),
  toText: () => resolve(''),
  toBuffer: () => resolve(new Buffer(0))
})