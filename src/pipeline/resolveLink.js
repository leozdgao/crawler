const url = require('url')
const _ = require('lodash')
const cheerio = require('cheerio')

module.exports = function resolveLink (predicate) {
  return (res, reqOpt, { queue, resolveCache, header }) => body => {
    console.log(`[200] Fetched: ${reqOpt.uri}`)

    const $ = cheerio.load(body)
    $('a').each((i, a) => {
      const href = $(a).attr('href')
      const newRequest = url.resolve(reqOpt.uri, href)

      // 下一次请求在同一个domain中，并且查看请求是否被缓存，防止循环爬取
      if (predicate(reqOpt.uri, href) && !resolveCache(newRequest)) {
        header.referer(reqOpt.uri)
        queue(newRequest)
      }
    })
  }
}

const isInSameDomain = (base, href) => {
  const newRequest = url.resolve(base, href)

  const nextUrl = url.parse(newRequest).hostname.split('.').slice(-2).join('.')
  const requestUrl = url.parse(base).hostname.split('.').slice(-2).join('.')

  return href && href[0] !== "#" && !_.startsWith(href, 'javascript') && nextUrl === requestUrl
}
