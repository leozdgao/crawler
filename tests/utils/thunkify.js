const test = require('tape')
const thunkify = require('../../src/utils/thunkify')

test('[utils/thunkify] Thunkify a sync task', assert => {
  function foo (a, b) { return a + b }

  assert.plan(1)

  const thunkedFoo = thunkify(foo, true)
  const thunk = thunkedFoo(1, 2)
  thunk((err, result) => {
    assert.equal(result, 3)
  })
})

test('[utils/thunkify] Thunkify an async task', assert => {
  function foo (a, b, cb) {
    setTimeout(_ => {
      cb.call(null, null, a, b)
    }, 500)
  }

  assert.plan(2)

  const thunkedFoo = thunkify(foo)
  const thunk = thunkedFoo(1, 2)
  thunk((err, a, b) => {
    assert.equal(a, 1)
    assert.equal(b, 2)
  })
})
