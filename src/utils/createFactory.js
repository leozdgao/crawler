/**
 * 为工厂函数提供的工具方法
 * @module utils/createFactory
 */

const _ = require('lodash')

module.exports = function createFactory (Constructor, ...args) {
  let instance = Constructor.apply({}, args)

  return {
    extend (Super, ...others) {
      if (_.isFunction(Super)) {
        instance = _.assign(instance, Super.prototype)
        Super.apply(instance, others)
      }

      return this
    },
    instance () {
      return instance
    }
  }
}
