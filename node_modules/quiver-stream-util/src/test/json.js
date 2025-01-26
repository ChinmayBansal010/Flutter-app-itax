import { 
  streamToJson, buffersToStream, textToStreamable,
  jsonToStreamable, streamableToJson
} from '../lib/stream-util'

const chai = require('chai')
const should = chai.should()

const originalJson = {
  "foo": "testing 123",
  "bar": [
    "a", "b"
  ]
}

const testJson = function(json) {
  json.foo.should.equal('testing 123')
  json.bar[0].should.equal('a')
  json.bar[1].should.equal('b')
}

const testBuffers = [
  '{ "fo', 'o": "', 'testing ', '123", ', '"bar', '": [ ',
  '"a", "b', '"] }' 
]

describe('basic json test', function() {
  it('sanity test with original content', () => 
    testJson(originalJson))

  it('sanity test with test buffers', () =>
    testJson(JSON.parse((testBuffers.join('')))))

  it('should parse json correctly', () =>
    streamToJson(buffersToStream(testBuffers)).then(testJson))

  it('should convert json to streamable', async function() {
    const streamable = jsonToStreamable(originalJson)

    should.exist(streamable.toJson)
    should.exist(streamable.toText)
    should.exist(streamable.toBuffer)

    streamable.contentType.should.equal('application/json')

    await streamable.toJson()
      .then(testJson)

    await streamable.toText()
      .then(JSON.parse).then(testJson)

    await streamable.toStream()
      .then(streamToJson).then(testJson)

  })

  it('should convert text to streamble', async function() {
    const jsonText = JSON.stringify(originalJson)
    const streamable = textToStreamable(jsonText)

    should.not.exist(streamable.toJson)
    should.exist(streamable.toText)

    await streamableToJson(streamable).then(testJson)

    should.exist(streamable.toJson)
  })
})
