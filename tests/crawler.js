// const _ = require('lodash')
// const url = require('url')
// const request = require('request')
// const EventEmitter = require('events')
// const cheerio = require('cheerio')
//
// const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
//
// const thunkify = func => {
//   return (...args) => {
//     return (cb, context) => {
//       func.apply(context, [ ...args, cb ])
//     }
//   }
// }
// const thunkedRequest = thunkify(request.get)
//
// class Crawler extends EventEmitter {
//
//   constructor (options) {
//     super()
//     const defaultOptions = {
//       throttle: 0, // 节流
//       maxConnections: 1, // 最多打开的连接数
//     }
//
//     this.options = _.assign(defaultOptions, options)
//     this.scheduler = new Scheduler(this.options)
//     this.cache = {}
//   }
//
//   crawl (items) {
//     if (!Array.isArray(items)) {
//       items = [items]
//     }
//
//     items.forEach(item => {
//       this.scheduler.request(item, (err, res, body) => {
//         // const targetUri = item.uri
//         if (err) {
//           this.emit('error', item, err)
//
//           return
//         }
//
//         if (res.statusCode === 200) {
//           let cacheKey = item
//           if (!_.isString(cacheKey)) cacheKey = JSON.stringify(cacheKey)
//
//           this.cache[cacheKey] = body
//           this.emit('data', item, body, res)
//         }
//         else {
//           // 为404单独触发一个事件
//           if (res.statusCode === 404) {
//             this.emit('req:404', item, body, res)
//           }
//
//           this.emit('req:error', item, body, res)
//         }
//       })
//     })
//   }
//
//   resolveCache (item) {
//     if (!_.isString(item)) {
//       item = JSON.stringify(item)
//     }
//     return this.cache[item]
//   }
// }
//
// class Scheduler {
//
//   constructor ({ throttle, maxConnections }) {
//     this.connections = 0
//     let throttledRequest = _.throttle((...args) => {
//       this.connections += 1
//       request.get.apply(this, args)
//     }, throttle)
//
//     this._request = throttledRequest
//   }
//
//   // 接受一个request的option对象
//   request (uri, cb) {
//     // 构造请求
//     const reqOpt = {
//       uri,
//       headers: {
//         "User-Agent": USER_AGENT
//       }
//     }
//
//     this._request(reqOpt, this._handleResult(cb))
//   }
//
//   _handleResult (cb) {
//     return (...args) => {
//       this.connections -= 1
//       cb.apply(null, args)
//     }
//   }
// }
//
// var crawler = new Crawler({
//   throttle: 300, // 每次请求的间隔，用于节流，单位毫秒
//   concurrency: 10, // 最多并发10条请求
//   whiteList: [
//     'http://www.gamefy.cn/'
//   ]
// })
//
// // 成功的请求
// crawler.on('data', (target, response) => {
//   console.log('[200] ' + target)
//
//   const $ = cheerio.load(response)
//   const links = $('a').each((i, a) => {
//     const href = $(a).attr('href')
//
//     if (href && href[0] != "#" && !_.startsWith(href, 'javascript')) {
//       const newRequest = url.resolve(target, href)
//       console.log(url.parse(newRequest).hostname)
//       // // 查看请求是否被缓存，防止循环爬取
//       // if (!crawler.resolveCache(newRequest)) crawler.crawl(newRequest)
//     }
//   })
// })
//
// // 404的请求
// crawler.on('req:404', (target, response) => {
//   console.log('[404] ' + target)
// })
//
// // 请求成功但状态码非2xx
// crawler.on('req:error', (target, response) => {
//   console.log('[Warning]' + target)
// })
//
// // 连接错误
// crawler.on('error', (target, err) => {
//   console.log('[Error]' + target, err.message)
// })
//
// crawler.crawl('http://www.gamefy.cn/')
// // crawler.crawl('http://localhost:8080')
