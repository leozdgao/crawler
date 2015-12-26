/**
 * 将一个函数转变成一个返回thunk的函数
 * @module utils/thunkify
 * @param  {Function} func 需要被thunkify的函数
 * @param  {Boolean} isSync 表示传入的函数是否为同步函数
 * @return {Function} 转化完后的函数
 */
module.exports = function thunkify (func, isSync) {
  return (...args) => (done, context) => {
    let task
    if (isSync) {
      task = function (...others) {
        const cb = others.pop()
        setTimeout(_ => {
          try {
            const result = func.apply(null, others)
            cb.call(context, null, result)
          }
          catch (e) {
            cb.call(context, e)
          }
        })
      }
    }
    else task = func

    try {
      task.apply(context, [ ...args, done ])
    }
    catch (e) {
      done.call(context, e)
    }
  }
}
