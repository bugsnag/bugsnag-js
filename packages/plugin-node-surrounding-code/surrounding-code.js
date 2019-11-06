const SURROUNDING_LINES = 3
const MAX_LINE_LENGTH = 200

const { createReadStream } = require('fs')
const { Writable } = require('stream')
const pump = require('pump')
const byline = require('byline')
const { reduce } = require('@bugsnag/core/lib/es-utils')

module.exports = {
  init: client => {
    if (!client._config.sendCode) return

    const loadSurroundingCode = (stackframe, cache) => new Promise((resolve, reject) => {
      try {
        if (!stackframe.lineNumber || !stackframe.file) return resolve(stackframe)
        const cacheKey = `${stackframe.file}@${stackframe.lineNumber}`
        if (cacheKey in cache) {
          stackframe.code = cache[cacheKey]
          return resolve(stackframe)
        }
        getSurroundingCode(stackframe.file, stackframe.lineNumber, (err, code) => {
          if (err) return resolve(stackframe)
          stackframe.code = cache[cacheKey] = code
          return resolve(stackframe)
        })
      } catch (e) {
        return resolve(stackframe)
      }
    })

    client.addOnError(event => new Promise((resolve, reject) => {
      const cache = Object.create(null)
      const allFrames = reduce(event.errors, (accum, er) => accum.concat(er.stacktrace), [])
      pMapSeries(allFrames.map(stackframe => () => loadSurroundingCode(stackframe, cache)))
        .then(resolve)
        .catch(reject)
    }), true)
  },
  configSchema: {
    sendCode: {
      defaultValue: () => true,
      validate: value => value === true || value === false,
      message: 'should be true or false'
    }
  }
}

const getSurroundingCode = (file, lineNumber, cb) => {
  const start = lineNumber - SURROUNDING_LINES
  const end = lineNumber + SURROUNDING_LINES

  const reader = createReadStream(file, { encoding: 'utf8' })
  const splitter = new byline.LineStream({ keepEmptyLines: true })
  const slicer = new CodeRange({ start, end })

  // if the slicer has enough lines already, no need to keep reading from the file
  slicer.on('done', () => reader.destroy())

  pump(reader, splitter, slicer, (err) => {
    // reader.destroy() causes a "premature close" error which we can tolerate
    if (err && err.message !== 'premature close') return cb(err)
    cb(null, slicer.getCode())
  })
}

// This writable stream takes { start, end } options specifying the
// range of lines that should be extracted from a file. Pipe a readable
// stream to it that provides source lines as each chunk. If the range
// is satisfied before the end of the readable stream, it will emit the
// 'done' event. Once a 'done' or 'finish' event has been seen, call getCode()
// to get the range in the following format:
// {
//   '10': 'function getSquare (cb) {',
//   '11': '  rectangles.find({',
//   '12': '    length: 12',
//   '13': '    width: 12',
//   '14': '  }, err => cb)',
//   '15': '}'
// }
class CodeRange extends Writable {
  constructor (opts) {
    super({ ...opts, decodeStrings: false })
    this._start = opts.start
    this._end = opts.end
    this._n = 0
    this._code = {}
  }

  _write (chunk, enc, cb) {
    this._n++
    if (this._n < this._start) return cb(null)
    if (this._n <= this._end) {
      this._code[String(this._n)] = chunk.length <= MAX_LINE_LENGTH ? chunk : chunk.substr(0, MAX_LINE_LENGTH)
      return cb(null)
    }
    this.emit('done')
    return cb(null)
  }

  getCode () {
    return this._code
  }
}

const pMapSeries = (ps) => {
  return new Promise((resolve, reject) => {
    const res = []
    ps
      .reduce((accum, p) => {
        return accum.then(r => {
          res.push(r)
          return p()
        })
      }, Promise.resolve())
      .then(r => { res.push(r) })
      .then(() => { resolve(res.slice(1)) })
  })
}
