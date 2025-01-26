import { error } from 'quiver-error'

export const createPromise = construct => 
  new Promise(construct)

export const resolve = val => 
  Promise.resolve(val)

export const reject = err => 
  Promise.reject(err)

export const timeout = time =>
  createPromise(resolve =>
    setTimeout(resolve, time))

export const safePromised = fn =>
  (...args) =>
    createPromise(resolve =>
      resolve(fn(...args)))

export const promisify = fn =>
  (...args) =>
    createPromise((resolve, reject) =>
      fn(...args, (err, result) =>
        err ? reject(err) : resolve(result)))

export const runAsync = gen => {
  const doNext = action => {
    let done, value
    try {
      ({ done, value }) = action()
    } catch(err) {
      return reject(err)
    }
    
    if(done) return value

    return resolve(value).then(
      result => doNext(() => gen.next(result)),
      err => doNext(() => gen.throw(err)))
  }

  return resolve(doNext(() => gen.next()))
}

export const async = fn =>
  (...args) => 
    resolve(fn(...args)).then(runAsync)

export const promisifyMethod = (object, method) =>
  promisify((...args) =>
    object[method](...args))

export const promisifyMethods = (object, methods) =>
  methods.reduce((result, method) => {
    result[method] = promisifyMethod(object, method)
    return result
  }, Object.create(object))