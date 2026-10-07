import ErrorStackParser from '../lib/error-stack-parser'
import upstream from 'error-stack-parser'

describe('@bugsnag/core/lib/error-stack-parser', () => {
  const cases: Array<{
    name: string
    source: string
    fileName: string
    functionName?: string
    lineNumber: number
    columnNumber: number
  }> = [
    { name: 'anonymous async V8', source: '    at async /app.js:1:123', fileName: '/app.js', functionName: 'async', lineNumber: 1, columnNumber: 123 },
    { name: 'named async V8', source: '    at async foo (/app.js:2:10)', fileName: '/app.js', functionName: 'async foo', lineNumber: 2, columnNumber: 10 },
    { name: 'anonymous V8', source: '    at /app.js:3:5', fileName: '/app.js', lineNumber: 3, columnNumber: 5 },
    { name: 'named sync V8', source: '    at bar (/app.js:4:6)', fileName: '/app.js', functionName: 'bar', lineNumber: 4, columnNumber: 6 },
    { name: 'Firefox', source: 'baz@/app.js:5:7', fileName: '/app.js', functionName: 'baz', lineNumber: 5, columnNumber: 7 },
    { name: 'Safari', source: 'qux@/app.js:6:8', fileName: '/app.js', functionName: 'qux', lineNumber: 6, columnNumber: 8 },
    { name: 'async in filename', source: '    at /async-utils.js:1:1', fileName: '/async-utils.js', lineNumber: 1, columnNumber: 1 },
    { name: 'async in path', source: '    at /async/app.js:1:1', fileName: '/async/app.js', lineNumber: 1, columnNumber: 1 },
    { name: 'async followed by a tab', source: '    at async\t/app.js:1:123', fileName: '/app.js', functionName: 'async', lineNumber: 1, columnNumber: 123 },
    { name: 'async local path', source: '    at /async/app.js:1:1', fileName: '/async/app.js', lineNumber: 1, columnNumber: 1 },
    { name: 'named asyncHandler', source: '    at asyncHandler (/app.js:1:1)', fileName: '/app.js', functionName: 'asyncHandler', lineNumber: 1, columnNumber: 1 },
    { name: 'multiple whitespace characters', source: '    at async \t  /app.js:1:123', fileName: '/app.js', functionName: 'async', lineNumber: 1, columnNumber: 123 }
  ]

  it.each(cases)('parses $name frames', ({ source, fileName, functionName, lineNumber, columnNumber }) => {
    const frames = ErrorStackParser.parse({ stack: source })
    expect(frames).toHaveLength(1)
    expect(frames[0].fileName).toBe(fileName)
    expect(frames[0].functionName).toBe(functionName)
    expect(frames[0].lineNumber).toBe(lineNumber)
    expect(frames[0].columnNumber).toBe(columnNumber)
    expect(frames[0].source).toBe(source)
    expect(typeof frames[0].getFileName).toBe('function')
  })

  it.each(['   ', '\t\t', ' \t \t '])('normalizes anonymous async whitespace %p', whitespace => {
    const source = '    at async' + whitespace + '/app.js:1:123'
    const frames = ErrorStackParser.parse({ stack: source })
    expect(frames).toHaveLength(1)
    expect(frames[0]).toMatchObject({
      fileName: '/app.js',
      functionName: 'async',
      lineNumber: 1,
      columnNumber: 123,
      source
    })
  })

  it('corrects only anonymous async frames in a mixed stack', () => {
    const stack = 'Error: probe\n' + cases.map(testCase => testCase.source).join('\n')
    const expected = upstream.parse({ name: 'Error', message: 'probe', stack })
    const frames = ErrorStackParser.parse({ stack })

    for (const index of [0, 6, 9]) {
      expected[index].fileName = '/app.js'
      expected[index].functionName = 'async'
    }
    expect(frames).toEqual(expected)
  })

  it('leaves a mixed Firefox and Safari stack unchanged', () => {
    const error = { name: 'Error', message: 'probe', stack: cases[4].source + '\n' + cases[5].source }
    expect(ErrorStackParser.parse(error)).toEqual(upstream.parse(error))
  })

  it('preserves the upstream API without modifying it', () => {
    expect(ErrorStackParser).not.toBe(upstream)
    expect(Object.keys(ErrorStackParser).sort()).toEqual(Object.keys(upstream).sort())
    Object.keys(upstream).filter(key => key !== 'parse').forEach(key => {
      expect(ErrorStackParser[key]).toBe(upstream[key as keyof typeof upstream])
    })
    expect(upstream.parse({ name: 'Error', message: 'probe', stack: cases[0].source })[0].fileName).toBe('async /app.js')
  })

  it('corrects empty and null function names but preserves named frames and missing filenames', () => {
    const frames = [
      { functionName: '', fileName: 'async /app.js' },
      { functionName: null, fileName: 'async \t /app.js' },
      { functionName: 'foo', fileName: 'async /app.js' },
      { functionName: undefined, fileName: undefined },
      { functionName: undefined, fileName: 'async-utils.js' }
    ]
    const parse = jest.spyOn(ErrorStackParser, 'parseV8OrIE').mockReturnValue(frames)
    try {
      expect(ErrorStackParser.parse({ stack: cases[0].source })).toEqual([
        { functionName: 'async', fileName: '/app.js' },
        { functionName: 'async', fileName: '/app.js' },
        { functionName: 'foo', fileName: 'async /app.js' },
        { functionName: undefined, fileName: undefined },
        { functionName: undefined, fileName: 'async-utils.js' }
      ])
    } finally {
      parse.mockRestore()
    }
  })

  it('returns the original StackFrame instances with their prototypes and accessors intact', () => {
    const error = { name: 'Error', message: 'probe', stack: cases[0].source }
    const frames = upstream.parse(error)
    const frame = frames[0]
    const prototype = Object.getPrototypeOf(frame)
    const parse = jest.spyOn(ErrorStackParser, 'parseV8OrIE').mockReturnValue(frames)
    try {
      expect(ErrorStackParser.parse(error)).toBe(frames)
      expect(frames[0]).toBe(frame)
      expect(Object.getPrototypeOf(frame)).toBe(prototype)
      expect(frame.getFunctionName()).toBe('async')
      expect(frame.getFileName()).toBe('/app.js')
      frame.setFileName('/changed.js')
      expect(frame.getFileName()).toBe('/changed.js')
    } finally {
      parse.mockRestore()
    }
  })

  it('preserves upstream parsing errors', () => {
    expect(() => ErrorStackParser.parse({})).toThrow('Cannot parse given Error object')
  })
})