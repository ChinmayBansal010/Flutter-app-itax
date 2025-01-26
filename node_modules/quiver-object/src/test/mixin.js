import { mixin } from '../lib/object'

import chai from 'chai'
const should = chai.should()
const expect = chai.expect

describe('mixin test', () => {
  it('should mixin getter', () => {
    const obj = {
      get foo() {
        return 'foo'
      }
    }

    const bar = {
      get bar() {
        return 'bar'
      }
    }

    mixin(obj, bar)
    expect(obj.bar).to.equal('bar')

    expect(() => {
      obj.bar = 'baz'
    }).to.throw()
  })

  it('should override original getter', () => {
    const obj = {
      get foo() {
        return 'foo'
      }
    }

    const other = {
      foo: 'bar'
    }

    mixin(obj, other)
    expect(obj.foo).to.equal('bar')

    expect(() => {
      obj.foo = 'baz'
    }).to.not.throw()
  })
})
