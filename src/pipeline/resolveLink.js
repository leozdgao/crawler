const url = require('url')
const _ = require('lodash')
const cheerio = require('cheerio')

module.exports = function resolveLink (predicate) {
  return (reqOpt, res, { queue, resolveCache }) => body => {
    const $ = cheerio.load(res.body)
    $('a').each((i, a) => {
      const href = $(a).attr('href')

      // TODO: 分析其是否在同一个主域名下
      if (predicate.call(null, reqOpt.uri, href)) {
        const newUrl = url.resolve(reqOpt.uri, href)
        // 查看请求是否被缓存，防止循环爬取
        if (!resolveCache(newUrl)) {
          queue(newRequest)
        }
      }
    })
  }
}

const isInSameDomain = (base, href) => {
  return href && href[0] !== "#" && !_.startsWith(href, 'javascript')
}
