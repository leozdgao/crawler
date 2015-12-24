/**
 * 用于伪造请求头部
 *
 * - 自定义ua，可选mobile还是pc
 * - 自动添加referer
 * - 登录部分
 * - 内容协商头部
 *
 * @module requestMocker
 * @author leozdgao
 * @return {RequestHeader} 返回一个RequestHeader实例
 */

const _ = require('lodash')
const defaults = require('./defaults')
const normalizeNegotiator = require('./normalizeNegotiator')

/**
 * 创建RequestHeader的工厂函数
 * @type {function}
 */
module.exports = createRequestHeader

/**
 * 生成一个默认的User-Agent头部
 * @param  {string} type 可选择是PC或者是Mobile
 * @return {string} 返回一个默认的User-Agent头部
 */
function getDefaultUa (type) {
  if (type === 'mobile') return DEFAULT_MOBILE_USER_AGENT
  else return DEFAULT_USER_AGENT
}

/**
 * 创建RequestHeader的工厂函数
 * @param  {object} options 给RequestHeader的配置
 * @return {RequestHeader} 返回一个RequestHeader实例
 */
function createRequestHeader (options) {
  const {
    // 可选值为'pc'或者'mobile'，其他值统一认为是pc
    ua = 'pc',
    // 是否在Accept头部加加入image/webp
    webp = false,
    ...others
  } = options

  /**
   * RequestHeader类
   * @class
   */
  class RequestHeader {

    constructor () {
      this._negotiator = {
        // text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
        types: [
          'html', 'xhtml',
          { type: 'xml', priority: 0.9 }
        ],
        // gzip, deflate, sdch
        encodings: [ 'gzip', 'deflate', 'sdch' ],
        // en-US,en;q=0.8,zh-CN;q=0.6,zh-TW;q=0.4
        langs: [
          'en-US',
          { type: 'en', priority: 0.8 },
          { type: 'zh-CN', priority: 0.6 },
          { type: 'zh-TW', priority: 0.4 }
        ]
      }
      if (webp) this._negotiator.types.push('webp')

      this._headers = {
        "User-Agent": getDefaultUa(ua),
        ...normalizeNegotiator(this._negotiator),
        ...others
      }

      // 用到的一些默认值常量
      this._defaults = defaults
    }

    // ----------------------内容协商-------------------------

    accept (types) {
      return this.negotiate({ types })
    }

    lang (langs) {
      return this.negotiate({ langs })
    }

    encoding (encodings) {
      return this.negotiate({ encodings })
    }

    /**
     * 更新内部的Negotiator对象，并更新相关的内容协商头部
     * @param  {object} newNegotiator 用于更新的Negotiator对象，使用object.assign
     * @return {}               [description]
     */
    negotiate (newNegotiator) {
      this._negotiator = _.extend(this._negotiator, newNegotiator)

      return this.extend(
        normalizeNegotiator(this._negotiator)
      )
    }

    // ------------------------其他---------------------------

    /**
     * 负责更新Referer头部
     * @param  {string} 新的Referer头部
     * @return {RequestHeader} 返回对象本身
     */
    referer (origin) {
      return this.extend({
        "Referer": origin
      })
    }

    /**
     * 负责更新User-Agent头部
     * @param  {string} newUa 新的User-Agent头部
     * @return {RequestHeader} 返回对象本身
     */
    ua (newUa) {
      return this.extend({
        "User-Agent": newUa
      })
    }

    // -----------------------------------------------------

    /**
     * 批量更新现有头部
     * @param  {object} newHeaders 新的请求头对象，使用object.assign
     * @return {RequestHeader} 返回对象本身
     */
    extend (obj) {
      if (_.isObject(obj)) {
        const newHeaders = _.pick(obj, _.isString)
        this.headers = _.assign(this._headers, newHeaders)
      }

      return this
    }

    /**
     * 返回headers对象
     * @return {object} 表示头部的Plain Object
     */
    toPlainObject () {
      return this._headers
    }
  }

  return new RequestHeader()
}