const test = require('tape')
const thunkify = require('../../src/utils/thunkify')
const createScheduler = require('../../src/scheduler')

function foo (a, b, cb) {
  setTimeout(_ => {
    cb(null, a + b)
  }, 500)
}

const thunkedFoo = thunkify(foo)
const thunk = thunkedFoo(1, 2)
const meta = 0

// 测试节流控制和最大工作数
test('[scheduler] manage the task events', assert => {
  const scheduler = createScheduler({
    throttle: 300,
    maxWorkers: 2
  })

  assert.plan(4)

  // 接收一个thunk为参数
  scheduler.queue(thunk, 'meta')
  scheduler.queue(_ => { throw Error('error') }, 'err')

  scheduler.on('done', ({ meta, args }) => {
    assert.equal(meta, 'meta')
    assert.equal(args[0], 3)
  })
  scheduler.on('fail', ({ meta, err }) => {
    assert.equal(meta, 'err')
    assert.equal(err.message, 'error')
  })
})

test('[scheduler] check max workers control', assert => {
  const scheduler = createScheduler({
    throttle: 300,
    maxWorkers: 2
  })
  let count = 0

  assert.plan(4)

  scheduler.queue(thunk, 'meta')
  assert.equal(scheduler.workersCount, 1)
  scheduler.queue(thunk, 'meta')
  assert.equal(scheduler.workersCount, 2)
  scheduler.queue(thunk, 'meta')
  assert.equal(scheduler.workersCount, 2)
  scheduler.queue(thunk, 'meta')
  assert.equal(scheduler.workersCount, 2)
})
