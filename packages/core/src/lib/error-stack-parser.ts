import ErrorStackParser from 'error-stack-parser'

type StackFrame = ErrorStackParser.StackFrame

// error-stack-parser >=2.0.7 stopped recognising V8 anonymous async frames
// (e.g. "at async https://example.com/foo.js:1:123") as having a functionName
// of "async", instead treating the whole "async <url>" string as the fileName.
// There's no newer upstream release that fixes this, so we patch the affected
// frames here rather than downgrade the dependency.
const ASYNC_PREFIX = /^async\s+/

function parse (error: any): StackFrame[] {
  const frames = ErrorStackParser.parse(error)
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    if ((frame.functionName === undefined || frame.functionName === null || frame.functionName === '') &&
        typeof frame.fileName === 'string' && ASYNC_PREFIX.test(frame.fileName)) {
      frame.fileName = frame.fileName.replace(ASYNC_PREFIX, '')
      frame.functionName = 'async'
    }
  }
  return frames
}

export default Object.assign({}, ErrorStackParser, { parse })
