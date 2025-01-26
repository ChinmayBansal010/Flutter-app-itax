import { safePromised } from 'quiver-promise'

const assertFunction = fn => {
  if(typeof(fn) != 'function') {
    throw new Error('argument must be of type function')
  }
}

export const safeHandler = (handler, options={}) => {
  const { safeWrapped=false } = options

  if(safeWrapped) return handler

  assertFunction(handler)
  options.safeWrapped = true

  return safePromised(handler)
}

export const safeBuilder = (builder, options={}) => {
  const { safeWrapped=false } = options

  if(safeWrapped) return builder

  assertFunction(builder)
  options.safeWrapped = true

  const wrappedBuilder = safePromised(builder)

  return (...args) =>
    wrappedBuilder(...args).then(safeHandler)
}