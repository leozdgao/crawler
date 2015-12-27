const test = require('tape')
const url = require('url')
const _ = require('lodash')
const cheerio = require('cheerio')
const crawlerModule = require('../src')
const {
  createCrawler, createScheduler, createRequestHeader
} = crawlerModule

test('[Crawler] Try fetch all link in pages', assert => {
  const crawler = createCrawler({
    scheduler: createScheduler({
      throttle: 300, maxWorkers: 10
    }),
    requestMocker: createRequestHeader()
  })

  crawler.on('data', (reqOpt, res) => {
    console.log(`[200] Fetched: ${reqOpt.uri}`)
// console.log(res.body)
    const $ = cheerio.load(res.body)
    $('a').each((i, a) => {
      const href = $(a).attr('href')

      if (href && href[0] !== "#" && !_.startsWith(href, 'javascript')) {
        const newRequest = url.resolve(reqOpt.uri, href)

        // TODO: 分析其是否在同一个主域名下
        const nextUrl = url.parse(newRequest).hostname.split('.').slice(-2).join('.')
        const requestUrl = url.parse(reqOpt.uri).hostname.split('.').slice(-2).join('.')
// console.log(nextUrl)
// console.log(requestUrl)

        // 下一次请求在同一个domain中，并且查看请求是否被缓存，防止循环爬取
        if (nextUrl === requestUrl && !crawler.resolveCache(newRequest)) {
          crawler.crawl(newRequest)
        }
      }
    })
  })
  crawler.on('res:404', reqOpt => {
    console.log(`[404] Not Found: ${reqOpt.uri}`)
  })
  crawler.on('fail', _ => {
    console.log('fail')
  })

  crawler.crawl('http://www.gamefy.cn/')
  // crawler.crawl('http://localhost:8080/')
  // const stream = crawler.crawl('http://localhost:8080/')
  // stream.subscribe()
})
