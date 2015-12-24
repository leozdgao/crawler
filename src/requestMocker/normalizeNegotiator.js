const mime = require('mime')
const _ = require('lodash')
const or = require('./utils/or')

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

module.exports = normalizeNegotiator

/**
 * 生成默认的内容协商头部
 * @param  {Negotiator} types     [description]
 * @return {string} 根据Negotiator对象生成的内容协商头部
 */
function normalizeNegotiator ({ types, encodings, langs }) {
  types = normalizeAcceptArray(types)

  const minPriority = _.min(types, o => o.priority)
  types.push({
    type: "*/*",
    // 最小不能小于0.1
    priority: minPriority < 0.1 ? 0.1 : minPriority - 0.1
  })

  return {
    "Accept": getAcceptString(types, mime.lookup),
    "Accept-Encoding": getAcceptString(encodings),
    "Accept-Language": getAcceptString(langs)
  }
}

// 数组中仅包含字符串和对象
function normalizeAcceptArray (arr) {
  if (!Array.isArray(arr)) arr = [ arr ]

  return arr
    .filter(isValidAcceptObject)
    .map(type => {
      if (_.isString) type = { type: refactor(type), priority: 1 }
      return type
    })
}

function getAcceptString (arr, refactor = _.identity) {
  return arr
    .map(joinAcceptObject)
    .join(',')
}

function joinAcceptObject ({ type, priority }) {
  return priority < 1 ? `${type};${priority}` : type
}
