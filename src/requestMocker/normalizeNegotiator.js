const mime = require('mime')
const _ = require('lodash')
const or = require('../utils/or')

//
// {
//   type: String,
//   priority: Number
// }
//
const isValidAcceptObject =  or(
  _.isString,
  val => {
    // 是对象且priority属性为数字
    return _.isObject(val) &&
      _.isString(val.type) &&
      !isNaN(Number(val.priority))
  }
)

/**
 * 生成默认的内容协商头部
 * @module requestMocker/normalizeNegotiator
 * @param  {Negotiator} types     [description]
 * @return {string} 根据Negotiator对象生成的内容协商头部
 */
function normalizeNegotiator ({ types, encodings, langs }) {
  types = normalizeAcceptArray(types, mime.lookup.bind(mime))

  // 为Accept头部加上*/*，并给予最低权值
  const minPriority = _.min(types, o => o.priority).priority
  types.push({
    type: "*/*",
    // 最小不能小于0.1
    priority: minPriority < 0.1 ? 0.1 : minPriority - 0.1
  })

  encodings = normalizeAcceptArray(encodings)
  langs = normalizeAcceptArray(langs)

  return {
    "Accept": getAcceptString(types),
    "Accept-Encoding": getAcceptString(encodings),
    "Accept-Language": getAcceptString(langs)
  }
}

/**
 * 将一个数组中的元素转化为AcceptObject对象的数组
 * @param  {Array} arr 装满AcceptObject对象的数组
 * @param  {Function} refactor
 * @return {Array}          [description]
 */
function normalizeAcceptArray (arr, refactor = _.identity) {
  if (!Array.isArray(arr)) arr = [ arr ]

  return arr
    .filter(isValidAcceptObject)
    .map(accObj => {
      if (_.isString(accObj)) accObj = { type: accObj, priority: 1 }

      accObj.type = refactor(accObj.type)

      return accObj
    })
}

/**
 * 将一个AcceptObject对象数组序列化为可作为Accept头部的字符串
 * @return {String} 作为内容协商头部的值
 */
function getAcceptString (arr) {
  return arr
    .map(joinAcceptObject)
    .join(',')
}

/**
 * 将AcceptObject序列化成字符串
 * @param  {AcceptObject} accObj 需要序列化的对象
 * @return {String} 序列化后的字符串
 */
function joinAcceptObject ({ type, priority }) {
  return priority < 1 ? `${type};q=${priority}` : type
}

module.exports = normalizeNegotiator
