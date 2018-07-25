const SURROUNDING_LINES = 3
const { readFile } = require('fs')

module.exports = {
  init: client => {
    const loadSurroundingCode = stackframe => new Promise((resolve, reject) => {
      try {
        if (!stackframe.lineNumber || !stackframe.file) return resolve(stackframe)
        getSurroundingCode(stackframe.file, stackframe.lineNumber, (err, code) => {
          if (err) return resolve(stackframe)
          stackframe.code = code
          return resolve(stackframe)
        })
      } catch (e) {
        return resolve(stackframe)
      }
    })

    client.config.beforeSend.push(report => new Promise((resolve, reject) => {
      Promise.all(report.stacktrace.map(loadSurroundingCode))
        .then(stacktrace => {
          report.stacktrace = stacktrace
          resolve()
        })
        .catch(reject)
    }))
  }
}

const getSurroundingCode = (file, lineNumber, cb) => {
  readFile(file, 'utf8', (err, data) => {
    if (err) return cb(err)
    const lines = data.split('\n')
    const start = Math.max(0, lineNumber - SURROUNDING_LINES - 1)
    const end = Math.min(lines.length, lineNumber + SURROUNDING_LINES)
    cb(null, lines
      .slice(start, end)
      .reduce((accum, line, i) => {
        accum[start + (i + 1)] = line
        return accum
      }, {}))
  })
}
