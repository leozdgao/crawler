/**
 * 负责请求的节流和最大连接数的控制
 * @module scheduler
 * @author leozdgao
 * @return {Function} 一个Scheduler的工厂方法
 */

const EventEmmiter = require('events')
const _ = require('lodash')

/**
 * 创建Scheduler的工厂方法
 * @param  {Object} options 
 * @return {Object} 一个Scheduler实例
 */
function createScheduler (options) {
  const instance = _.assign(
    Scheduler.call({}, options),
    EventEmmiter.prototype
  )
  EventEmmiter.call(instance)

  return instance

  /**
   * Scheduler类
   * @class
   * @param {Object} options 创建一个Scheduler必要的配置
   */
  function Scheduler (options) {
    // 一些私用常量
    const { throttle = 500, maxWorkers = 10 } = options
    const taskBuffer = []
    const executeTask = _.throttle((thunk, meta) => {
      try {
        thunk(afterExecute(meta))
      }
      catch (err) {
        this.emit('fail', { meta, err })
      }
    }, throttle)
    const afterExecute = meta => (err, ...args) => {
      // task已完成
      this.workersCount -= 1
      if (err) this.emit('fail', { err, meta })
      else this.emit('done', { args, meta })

      // 检查是否可以将缓存中的task拿出来继续执行
      if (this.workersCount < maxWorkers
        && taskBuffer.length > 0) {
        const thunk = taskBuffer.shift()
        executeTask(thunk)
      }
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
      // 首先检查当前workers的数量
      if (this.workersCount >= maxWorkers) {
        // 先讲task缓存起来
        taskBuffer.push(thunk)
      }
      else {
        // task被激活
        this.workersCount += 1
        executeTask(thunk, meta)
      }
    }

    return this
  }
}

module.exports = createScheduler
