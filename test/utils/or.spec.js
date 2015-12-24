const test = require('tape')
const _ = require('lodash')
const or = require('../../src/utils/or')

test("Take some predicates and action like logical operation: or", t => {
  t.plan(4)

  const funcs = [
    _.isString, _.isPlainObject, _.isFunction
  ]
  const val0 = "string"
  const val1 = {}
  const val2 = _ => {}
  const val3 = []

  const expected = false
  const predicate = or.apply(null, funcs)

  t.equal(predicate(val0), true)
  t.equal(predicate(val1), true)
  t.equal(predicate(val2), true)
  t.equal(predicate(val3), false)
})
