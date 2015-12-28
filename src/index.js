/**
 * 创建一个Crawler爬虫实例
 * @module crawler
 * @author leozdgao
 * @return {Function} 创建Crawler的工厂函数
 */

const _ = require('lodash')
const request = require('request')
const EventEmitter = require('events')
const Observable = require('zen-observable')
const applyPipeline = require('./pipeline/applyPipeline')
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

  const resStream = new Observable((observer) => {
    scheduler.on('done', ({ meta: reqOpt, args }) => {
      const [ res, body ] = args
      observer.next(
        [ res, reqOpt, { queue, header: requestMocker, resolveCache } ]
      )
    })
  })
  const resOKStream = resStream.filter(([ res, reqOpt ]) => {
    if (isResponseOK(res)) {
      const cacheKey = reqOpt.uri
      cache[cacheKey] = res

      return true
    }
    else return false
    // return isResponseOK(res)
  })
  const resFailStream = resStream.filter(([ res ]) => {
    return !isResponseOK(res)
  })

  // 通常是由于网络问题、权限问题等与请求结果无关的异常捕获
  scheduler.on('fail', ({ meta: reqOpt, err }) => {
    this.emit('fail', reqOpt, err)
  })

  /**
   * 开始让爬虫爬取相应目标
   * @param  {Array|String} targets 需要爬的url
   * @return {Pipeline} 一个提供数据消费的对象
   */
  this.crawl = targets => {
    if (!Array.isArray(targets)) {
      targets = [ targets ]
    }

    targets.forEach(queue)

    // pipeline
    return {
      subscribe (onData, onFailed) {
        if (!Array.isArray(onData)) onData = [ onData ]
        if (!Array.isArray(onFailed)) onFailed = [ onFailed ]

        resOKStream.subscribe({
          next: subscriber(onData)
        })
        resFailStream.subscribe({
          next: subscriber(onFailed)
        })

        function subscriber (middlewares) {
          return args => {
            const [ res ] = args
            const pipeline = applyPipeline(middlewares, args)

            pipeline(res.body)
          }
        }
      }
    }
  }

  /**
   * 查看缓存
   * @param  {String} key 缓存的key
   * @return {Any} 缓存的数据
   */
  function resolveCache (item) {
    if (!_.isString(item)) {
      item = JSON.stringify(item)
    }
    return cache[item]
  }

  /**
   * 向任务队列中放入新的需要爬的url
   * @param  {String|Object} url 需要爬的url
   */
  function queue (reqOpt) {
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
  createCrawler,
  createScheduler,
  createRequestHeader
}
