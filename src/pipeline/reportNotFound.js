module.exports = function requestNotFound (outputStream = process.stdout) {
  return (res, reqOpt, { queue, resolveCache, header }) => body => {
    if (res.statusCode === 404) {
      outputStream.write(`[404] Not Found: ${reqOpt.uri}\n`)
    }

    return body
  }
}
