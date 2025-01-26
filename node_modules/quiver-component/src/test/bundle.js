import {
  simpleHandlerBuilder, 
  transformFilter, handlerBundle
} from '../lib/export.js'

import { async } from 'quiver-promise'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const should = chai.should()

describe('bundle component test', () => {
  const bundle = handlerBundle(
  config => {
    let count = config.initial || 0

    const getCount = args => ''+count

    const increment = args => ++count

    const decrement = args => --count

    return { getCount, increment, decrement }
  })
  .simpleHandler('getCount', 'void', 'text')
  .simpleHandler('increment', 'void', 'void')
  .simpleHandler('decrement', 'void', 'void')

  const { 
    getCount, increment, decrement 
  } = bundle.toHandlerComponents()

  it('basic test', async(function*() {
    const config = { }

    const getCountHandler = yield getCount.loadHandler(config)
    const incrementHandler = yield increment.loadHandler(config)
    const decrementHandler = yield decrement.loadHandler(config)

    yield getCountHandler({}).should.eventually.equal('0')

    yield incrementHandler({})
    yield getCountHandler({}).should.eventually.equal('1')

    yield incrementHandler({})
    yield getCountHandler({}).should.eventually.equal('2')

    yield decrementHandler({})
    yield getCountHandler({}).should.eventually.equal('1')

    yield decrementHandler({})
    yield getCountHandler({}).should.eventually.equal('0')
  }))

  it('initialize test', async(function*() {
    const config = {
      initial: 2
    }

    const incrementHandler = yield increment.loadHandler(config)

    config.initial = 4
    const getCountHandler = yield getCount.loadHandler(config)

    yield getCountHandler({}).should.eventually.equal('2')
  }))

  it('bundle fork test', async(function*() {
    const bundle2 = bundle.fork()
      
    const { 
      getCount: getCount2, 
      increment: increment2
    } = bundle2.toHandlerComponents()

    const config = { }

    const getCountHandler = yield getCount.loadHandler(config)
    const incrementHandler = yield increment.loadHandler(config)

    const getCountHandler2 = yield getCount2.loadHandler(config)
    const incrementHandler2 = yield increment2.loadHandler(config)
    
    yield getCountHandler({}).should.eventually.equal('0')
    yield getCountHandler2({}).should.eventually.equal('0')

    yield incrementHandler({})
    yield getCountHandler({}).should.eventually.equal('1')
    yield getCountHandler2({}).should.eventually.equal('0')

    yield incrementHandler({})
    yield getCountHandler({}).should.eventually.equal('2')
    yield getCountHandler2({}).should.eventually.equal('0')

    yield incrementHandler2({})
    yield getCountHandler({}).should.eventually.equal('2')
    yield getCountHandler2({}).should.eventually.equal('1')
  }))

  it('privatized test', async(function*() {
    const forkTable = { }
    
    const getCount2 = getCount.fork(forkTable)
    const increment2 = increment.fork(forkTable)

    const config = { }

    const getCountHandler = yield getCount.loadHandler(config)
    const incrementHandler = yield increment.loadHandler(config)

    const getCountHandler2 = yield getCount2.loadHandler(config)
    const incrementHandler2 = yield increment2.loadHandler(config)
    
    yield getCountHandler({}).should.eventually.equal('0')
    yield getCountHandler2({}).should.eventually.equal('0')

    yield incrementHandler({})
    yield getCountHandler({}).should.eventually.equal('1')
    yield getCountHandler2({}).should.eventually.equal('0')

    yield incrementHandler({})
    yield getCountHandler({}).should.eventually.equal('2')
    yield getCountHandler2({}).should.eventually.equal('0')

    yield incrementHandler2({})
    yield getCountHandler({}).should.eventually.equal('2')
    yield getCountHandler2({}).should.eventually.equal('1')
  }))

  it('forked middleware test', async(function*() {
    const prefixer = simpleHandlerBuilder(config => {
      const prefix = config.prefix || ''

      return (args, text) => prefix + '-' + text
    }, 'text', 'text')

    const prefixFilter = transformFilter(prefixer, 'out')

    const bundle2 = bundle.fork()
      
    const { 
      getCount: getCount2, 
      increment: increment2
    } = bundle2.toHandlerComponents()

    getCount2.addMiddleware(prefixFilter)

    const forkTable = {}
    const getCount3 = getCount2.fork(forkTable)
    const increment3 = increment2.fork(forkTable)

    const config = { 
      prefix: 'foo'
    }

    const getCountHandler2 = yield getCount2.loadHandler(config)
    const incrementHandler2 = yield increment2.loadHandler(config)
    
    config.prefix = 'bar'

    const getCountHandler3 = yield getCount3.loadHandler(config)
    const incrementHandler3 = yield increment3.loadHandler(config)
    
    yield getCountHandler2({}).should.eventually.equal('foo-0')
    yield getCountHandler3({}).should.eventually.equal('bar-0')

    yield incrementHandler2({})
    yield getCountHandler2({}).should.eventually.equal('foo-1')
    yield getCountHandler3({}).should.eventually.equal('bar-0')

    yield incrementHandler2({})
    yield getCountHandler2({}).should.eventually.equal('foo-2')
    yield getCountHandler3({}).should.eventually.equal('bar-0')

    yield incrementHandler3({})
    yield getCountHandler2({}).should.eventually.equal('foo-2')
    yield getCountHandler3({}).should.eventually.equal('bar-1')
  }))
})