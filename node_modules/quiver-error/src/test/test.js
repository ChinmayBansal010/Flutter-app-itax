import { error } from '../lib/error'

import chai from 'chai'
const should = chai.should()

describe('quiver error test', () => {
  it('basic error test', () => {
    const err = error(404, 'Not Found')
    err.code.should.equal(404)
    err.errorCode.should.equal(404)
    err.message.should.equal('Not Found')
    console.log(err)
  })
})