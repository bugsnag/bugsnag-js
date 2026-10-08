var ErrorStackParser = require('error-stack-parser')
var assign = require('./es-utils/assign')

module.exports = assign({}, ErrorStackParser, {
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
