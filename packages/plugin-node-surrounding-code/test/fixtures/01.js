// this is just some arbitrary (but real) javascript for testing, taken from
// https://github.com/bengourley/source-map-decoder/

//
// This Writable steam reads a source map. It will buffer the entire
// input, and once the writable side is closed, it will output the map
// replacing the "mappings" property with human readable content.
//

const { Writable } = require('stream')
const vlq = require('vlq')

class SourceMapDecoder extends Writable {
  constructor (opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = { encoding: 'utf8' }
    }
    if (!cb) throw new Error('new SourceMapDecoder(opts, cb): cb is required')
    super(opts)
    this.input = ''
    if (cb) this.on('finish', () => cb(this.output()))
  }

  _write (chunk, enc, next) {
    this.input += chunk
    next()
  }

  output () {
    try {
      const map = JSON.parse(this.input)
      if (!map.mappings) throw new Error('source map had no "mappings" property')
      if (!Array.isArray(map.sources)) throw new Error('source map had no "sources" property')
      if (!Array.isArray(map.names)) throw new Error('source map had no "names" property')
      return JSON.stringify({
        ...map,
        mappings: formatMappings(map.mappings, map.sources, map.names)
      })
    } catch (e) {
      this.emit('error', e)
    }
  }
}

module.exports = SourceMapDecoder

const formatMappings = (mappings, sources, names) => {
  const vlqState = [ 0, 0, 0, 0, 0 ]
  return mappings.split(';').reduce((accum, line, i) => {
    accum[i + 1] = formatLine(line, vlqState, sources, names)
    vlqState[0] = 0
    return accum
  }, {})
}

const formatLine = (line, state, sources, names) => {
  const segs = line.split(',')
  return segs.map(seg => {
    if (!seg) return ''
    const decoded = vlq.decode(seg)
    for (var i = 0; i < 5; i++) {
      state[i] = typeof decoded[i] === 'number' ? state[i] + decoded[i] : state[i]
    }
    return formatSegment(...state.concat([ sources, names ]))
  })
}

const formatSegment = (col, source, sourceLine, sourceCol, name, sources, names) =>
  `${col + 1} => ${sources[source]} ${sourceLine + 1}:${sourceCol + 1}${names[name] ? ` ${names[name]}` : ``}`
