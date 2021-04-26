const { access, readFile } = require('fs').promises
const { F_OK } = require('fs').constants
const { SourceMapConsumer } = require('source-map')
const { join, normalize } = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))

const cache = {} // source map consumers are expensive

const sourceMapFor = async (file) => {
  try {
    const path = `${file}.map`
    await access(path, F_OK)
    return path
  } catch (e) {
    return null
  }
}

const transformFrame = async (basePath, frame) => {
  const sourcemapPath = await sourceMapFor(join(basePath, frame.file))
  if (!sourcemapPath) return { ...frame }

  const consumer = cache[normalize(sourcemapPath)]
  if (!consumer) return { ...frame }

  const mapping = consumer.originalPositionFor({
    line: frame.lineNumber,
    column: frame.columnNumber
  })
  if (!mapping || !mapping.line) return { ...frame }

  return {
    ...frame,
    lineNumber: mapping.line,
    columnNumber: mapping.column,
    file: mapping.source ? mapping.source.replace('webpack://', '.') : frame.file,
    method: mapping.name || frame.method
  }
}

module.exports = {
  loadSourcemaps: async (basePath) => {
    const files = await glob(join(basePath, '**', '*.js.map'))
    for (const file of files) {
      const contents = await readFile(file)
      // glob may return paths without the platform-specific separator
      cache[normalize(file)] = await new SourceMapConsumer(contents.toString())
    }
  },
  applySourcemaps: async (basePath, stack = []) =>
    Promise.all(stack.map(frame => transformFrame(basePath, frame)))
}
