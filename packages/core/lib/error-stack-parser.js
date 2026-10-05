const ErrorStackParser = require('error-stack-parser')

// error-stack-parser 2.0.7+ takes everything after "at " in a V8 frame without a
// parenthesised location as the location, so the "async " V8 prints before an
// anonymous async frame ends up in the file name
module.exports = {
  parse: error => {
    const frames = ErrorStackParser.parse(error)
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      if (!frame.functionName && frame.fileName && frame.fileName.indexOf('async ') === 0) {
        const fileName = frame.fileName.slice(6)
        frame.functionName = 'async'
        frame.fileName = ['eval', '<anonymous>'].indexOf(fileName) > -1 ? undefined : fileName
      }
    }
    return frames
  }
}
