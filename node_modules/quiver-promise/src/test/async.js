import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { async, promisify } from '../lib/promise.js'

chai.use(chaiAsPromised)
const should = chai.should()

const nextTick = promisify(process.nextTick)

const timesTwo = (num) => 
  nextTick().then(() => num*2)

const plusThree = (num) =>
  nextTick().then(() => num+3)

describe('async generator test', () => {
  it('nested yield', () => {
    const calc = async(function*(num) {
      return yield timesTwo(yield plusThree(num))
    })

    return calc(1).should.eventually.equal(8)
  })

  it('exception test', () => {
    const fn = async(function*() {
      throw new Error('fail')
    })

    return fn().should.be.rejected
  })
})