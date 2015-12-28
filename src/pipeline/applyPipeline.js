/**
 * 让数据经过pipeline处理
 * @module pipeline/applyPipeline
 * @author leozdgao
 * @return {Function} 用于应用pipeline的函数
 */

const _ = require('lodash')

module.exports = function applyPipeline (middlewares, args) {
  const [ res ] = args
  const composers = middlewares
    .filter(_.isFunction).map(f => f.apply(null, args))

  return _.flow.apply(_, composers)
}
