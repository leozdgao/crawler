const _ = require('lodash')
const url = require('url')
const EventEmitter = require('events')
const cheerio = require('cheerio')
const thunkify = require('../utils/thunkify')

const thunkedRequest = thunkify(request.get)

class Crawler extends EventEmitter {

  constructor (options) {
    super()

    const defaultOptions = {
      throttle: 0, // 节流
      maxConnections: 1, // 最多打开的连接数
    }

    this.options = _.assign(defaultOptions, options)
    this.scheduler = new Scheduler(this.options)
    this.cache = {}
  }

  crawl (items) {
    if (!Array.isArray(items)) {
      items = [ items ]
    }

    items.forEach(item => {
      this.scheduler.request(item, (err, res, body) => {
        // const targetUri = item.uri
        if (err) {
          this.emit('error', item, err)

          return
        }

        if (res.statusCode === 200) {
          let cacheKey = item
          if (!_.isString(cacheKey)) cacheKey = JSON.stringify(cacheKey)

          this.cache[cacheKey] = body
          this.emit('data', item, body, res)
        }
        else {
          // 为404单独触发一个事件
          if (res.statusCode === 404) {
            this.emit('req:404', item, body, res)
          }

          this.emit('req:error', item, body, res)
        }
      })
    })
  }

  resolveCache (item) {
    if (!_.isString(item)) {
      item = JSON.stringify(item)
    }
    return this.cache[item]
  }
}
