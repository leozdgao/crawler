/**
 * 创建一个Crawler爬虫实例
 * @module crawler
 * @author leozdgao
 * @return {Function} 创建Crawler的工厂函数
 */

const _ = require('lodash')
const request = require('request')
const EventEmitter = require('events')
const or = require('./utils/or')
const thunkify = require('./utils/thunkify')
const createFactory = require('./utils/createFactory')
const createScheduler = require('./scheduler')
const createRequestHeader = require('./requestMocker')

const thunkedRequest = thunkify(request.get)
const isResponseOK = res => res.statusCode === 200
const isResponseNotFound = res => res.statusCode === 404

function Crawler (options = {}) {
  const { scheduler, requestMocker } = options
  const cache = {}

  scheduler.on('done', ({ meta: reqOpt, args }) => {
    const [ res, body ] = args
    if (isResponseOK(res)) {
      const cacheKey = reqOpt.uri
      cache[cacheKey] = res

      this.emit('data', reqOpt, res)
    }
    else {
      if (isResponseNotFound(res)) {
        this.emit('res:404', reqOpt, res)
      }
      this.emit('res:fail', reqOpt, res)
    }
  })
  scheduler.on('fail', ({ meta: reqOpt, err }) => {
    this.emit('fail', reqOpt, err)
  })

  /**
   * [crawl description]
   * @param  {Array|String} targets 需要爬的url
   * @return {Pipeline} 一个提供数据消费的对象
   */
  this.crawl = targets => {
    if (!Array.isArray(targets)) {
      targets = [ targets ]
    }

    targets.forEach(this.queue)

    // pipeline
    return {}

    // 可以是一个String，也可以是一个request模块的配置对象
    // targets.filter(or(_.isString, _.isPlainObject))
    //   .forEach(reqOpt => {
    //     const headers = requestMocker.toPlainObject()
    //     if (_.isString(reqOpt)) {
    //       reqOpt = {
    //         uri: reqOpt,
    //         headers
    //       }
    //     }
    //     else {
    //       req.headers = _.assign({}, req.headers, headers)
    //     }
    //
    //     // 把reqOpt作为meta数据传递
    //     scheduler.queue(thunkedRequest(reqOpt), reqOpt)
    //   }
    // )
  }
  /**
   * 查看缓存
   * @param  {String} key 缓存的key
   * @return {Any} 缓存的数据
   */
  this.resolveCache = item => {
    if (!_.isString(item)) {
      item = JSON.stringify(item)
    }
    return cache[item]
  }
  /**
   * 向任务队列中放入新的需要爬的url
   * @param  {String|Object} url 需要爬的url
   */
  this.queue = reqOpt => {
    const headers = requestMocker.toPlainObject()
    const gzip = requestMocker.encoding().indexOf('gzip') >= 0
    if (_.isString(reqOpt)) {
      reqOpt = {
        uri: reqOpt,
        headers, gzip
      }
    }
    else {
      reqOpt.headers = _.assign({}, reqOpt.headers, headers)
    }

    // 把reqOpt作为meta数据传递
    scheduler.queue(thunkedRequest(reqOpt), reqOpt)
  }

  return this
}

function createCrawler (options) {
  return (
    createFactory(Crawler, options)
      .extend(EventEmitter)
      .instance()
  )
}

module.exports = {
  createCrawler, createScheduler, createRequestHeader
}
