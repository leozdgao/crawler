const test = require('tape')
const url = require('url')
const _ = require('lodash')
const cheerio = require('cheerio')
const crawlerModule = require('../src')
const resolveLink = require('../src/pipeline/resolveLink')
const {
  createCrawler, createScheduler, createRequestHeader
} = crawlerModule

const isInSameDomain = (base, href) => {
  const newRequest = url.resolve(base, href)
  const nextUrl = url.parse(newRequest).hostname.split('.').slice(-2).join('.')
  const requestUrl = url.parse(base).hostname.split('.').slice(-2).join('.')

  return href && href[0] !== "#" && !_.startsWith(href, 'javascript') && nextUrl === requestUrl
}


test('[Crawler] Try fetch all link in pages', assert => {
  const crawler = createCrawler({
    scheduler: createScheduler({
      throttle: 300, maxWorkers: 10
    }),
    requestMocker: createRequestHeader()
  })
  crawler.on('fail', _ => {
    console.log('fail')
  })

  const stream = crawler.crawl('http://localhost:8080/')
  stream.subscribe(
    resolveLink(isInSameDomain)
  )

  // crawler.crawl('http://www.gamefy.cn/')

})
