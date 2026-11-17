var ErrorStackParser = require('error-stack-parser')
var assign = require('./es-utils/assign')

module.exports = assign({}, ErrorStackParser, {
  extractLocation: function (urlLike) {
    if (urlLike.indexOf(':') === -1) return [urlLike]

    // Remove the frame's enclosing parentheses, keeping those in the filename.
    if (urlLike.charAt(0) === '(' && urlLike.charAt(urlLike.length - 1) === ')') {
      // Nested evals can leave extra wrappers after the line and column.
      urlLike = urlLike.slice(1, -1).replace(/(:\d+(?::\d+)?)\)+$/, '$1')
    }
    var parts = /(.+?)(?::(\d+))?(?::(\d+))?$/.exec(urlLike)
    return [parts[1], parts[2] || undefined, parts[3] || undefined]
  },
  parse: function (error) {
    var frames = ErrorStackParser.parse.call(this, error)
    for (var index = 0; index < frames.length; index++) {
      var frame = frames[index]
      if ((frame.functionName === undefined || frame.functionName === null || frame.functionName === '') &&
          typeof frame.fileName === 'string' && /^async\s+/.test(frame.fileName)) {
        frame.fileName = frame.fileName.replace(/^async\s+/, '')
        frame.functionName = 'async'
      }
    }
    return frames
  }
})
