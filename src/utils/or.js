const _ = require('lodash')

/**
 * 接受一些predicate函数，返回一个函数，和逻辑运算or是一样的
 * @param  {Function} ...funcs predicate函数
 * @return {Function} 一个整合了的predicate
 */
module.exports = function or (...funcs) {
  return (...args) => {
    funcs = funcs.filter(_.isFunction)

    for (let i = 0, l = funcs.length; i < l; i++) {
      if (funcs[i].apply(null, args)) return true
    }

    return false
  }
}
