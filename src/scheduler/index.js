/**
 * 负责请求的节流和最大连接数的控制
 * @module scheduler
 * @author leozdgao
 * @return {Function} 一个Scheduler的工厂方法
 */

const EventEmitter = require('events')
const createFactory = require('../utils/createFactory')

/**
 * Scheduler类
 * @class
 * @param {Object} options 创建一个Scheduler必要的配置
 */
function Scheduler (options = {}) {
  // 一些私用常量
  const { throttle = 500, maxWorkers = 10 } = options
  const taskBuffer = []
  let isActive = false

  const executeTask = ({ task, meta }) => {
    this.workersCount += 1

    try {
      task(afterExecute(meta))
    }
    catch (err) {
      this.emit('fail', { meta, err })
    }
  }
  const afterExecute = meta => (err, ...args) => {
    // task已完成
    this.workersCount -= 1
    if (err) this.emit('fail', { err, meta })
    else this.emit('done', { args, meta })
    
    // 检查是否可以将缓存中的task拿出来继续执行
    if (this.workersCount < maxWorkers
      && taskBuffer.length > 0 && !isActive) activate()
  }
  const activate = _ => {
    isActive = true

    const task = taskBuffer.shift()
    if (task) executeTask(task)

    const clt = setInterval(_ => {
      // 当超过最大workers数量时，停止轮询
      if (this.workersCount >= maxWorkers) {
        deactivate(clt)
        return
      }

      const task = taskBuffer.shift()
      if (task) executeTask(task)

      // 任务队列为空时，停止轮询
      if (taskBuffer.length <= 0) deactivate(clt)
    }, throttle)
  }
  const deactivate = clt => {
    clearInterval(clt)
    isActive = false
  }

  /**
   * 表示当前workers的数量
   * @member {Number} workersCount
   */
  this.workersCount = 0

  /**
   * 将任务放入任务队列中
   * @method
   * @param  {Function} task 一个thunk函数，表示需要执行的任务
   * @param  {Any} meta  与该任务相关的任意数据
   */
  this.queue = (thunk, meta) => {
    // 先讲task缓存起来
    taskBuffer.push({
      task: thunk,
      meta
    })

    // 如果当前没有worker在工作，则激活工作队列
    if (this.workersCount <= 0) activate()
  }

  return this
}

/**
 * 创建Scheduler的工厂方法
 * @param  {Object} options
 * @return {Object} 一个Scheduler实例
 */
function createScheduler (options = {}) {
  return (
    createFactory(Scheduler, options)
      .extend(EventEmitter)
      .instance()
  )
}

module.exports = createScheduler
