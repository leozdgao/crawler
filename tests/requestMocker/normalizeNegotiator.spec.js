const test = require('tape')
const normalizeNegotiator = require('../../src/requestMocker/normalizeNegotiator')

test('Try to normalize the negotiator headers in HTTP', assert => {
  const negoOptions = {
    types: [
      'html', 'xhtml',
      { type: 'xml', priority: 0.9 },
      { other: "exclude" }
    ],
    encodings: [ 'gzip', 'deflate', 'sdch' ],
    langs: [
      'en-US',
      { type: 'en', priority: 0.8 },
      { type: 'zh-CN', priority: 0.6 },
      { type: 'zh-TW', priority: 0.4 }
    ]
  }
  const negotiator = normalizeNegotiator(negoOptions)

  assert.plan(3)

  assert.equal(
    negotiator["Accept"],
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  )
  assert.equal(
    negotiator["Accept-Encoding"],
    "gzip,deflate,sdch"
  )
  assert.equal(
    negotiator["Accept-Language"],
    "en-US,en;q=0.8,zh-CN;q=0.6,zh-TW;q=0.4"
  )
})
