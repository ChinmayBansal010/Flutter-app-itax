import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

import { 
  safePromised, promisify, resolve, promiseChain 
} from '../lib/promise.js'

describe('safe promised test', () => {
  it('should return promise', () => {
    const fn = () => 'foo'
    const wrapped = safePromised(fn)

    wrapped().then((res) => 
      res.should.equal('foo')).should.be.fulfilled
  })

  it('should catch exception', () => {
    const fn = () => { throw new Error('test') }
    const wrapped = safePromised(fn)

    return wrapped().should.be.rejected
  })
})

describe('promisify test', () => {
  const asyncTimesTwo = (num, callback) => 
    process.nextTick(() => callback(null, num*2))

  const asyncError = (callback) =>
    process.nextTick(() => callback(new Error()))

  const promisedTimesTwo = promisify(asyncTimesTwo)
  const promisedError = promisify(asyncError)

  it('should convertible to promise', () =>
    promisedTimesTwo(3).should.eventually.equal(6))

  it('should reject async errors', () =>
    promisedError().should.be.rejected)
})