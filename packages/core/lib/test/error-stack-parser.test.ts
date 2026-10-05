import ErrorStackParser from '../error-stack-parser'

describe('error-stack-parser', () => {
  it('moves the async prefix of an anonymous async V8 frame to the function name', () => {
    const error = new Error('async failure')
    error.stack = 'Error: async failure\n    at async https://cdn.example.test/assets/app.js:1:123'

    const frames = ErrorStackParser.parse(error)

    expect(frames.length).toBe(1)
    expect(frames[0].functionName).toBe('async')
    expect(frames[0].fileName).toBe('https://cdn.example.test/assets/app.js')
    expect(frames[0].lineNumber).toBe(1)
    expect(frames[0].columnNumber).toBe(123)
  })

  it('drops the file name of an anonymous async V8 frame in an anonymous script', () => {
    const error = new Error('async failure')
    error.stack = 'Error: async failure\n    at async <anonymous>:1:41'

    const frames = ErrorStackParser.parse(error)

    expect(frames.length).toBe(1)
    expect(frames[0].functionName).toBe('async')
    expect(frames[0].fileName).toBeUndefined()
    expect(frames[0].lineNumber).toBe(1)
    expect(frames[0].columnNumber).toBe(41)
  })

  it('keeps spaces in the path of an anonymous async V8 frame', () => {
    const error = new Error('async failure')
    error.stack = 'Error: async failure\n    at async /var/app/my project/index.js:2:9'

    const frames = ErrorStackParser.parse(error)

    expect(frames.length).toBe(1)
    expect(frames[0].functionName).toBe('async')
    expect(frames[0].fileName).toBe('/var/app/my project/index.js')
    expect(frames[0].lineNumber).toBe(2)
    expect(frames[0].columnNumber).toBe(9)
  })

  it('leaves a named async V8 frame unchanged', () => {
    const error = new Error('async failure')
    error.stack = 'Error: async failure\n    at async fn (https://cdn.example.test/assets/app.js:1:123)'

    const frames = ErrorStackParser.parse(error)

    expect(frames.length).toBe(1)
    expect(frames[0].functionName).toBe('async fn')
    expect(frames[0].fileName).toBe('https://cdn.example.test/assets/app.js')
    expect(frames[0].lineNumber).toBe(1)
    expect(frames[0].columnNumber).toBe(123)
  })

  it('leaves an anonymous V8 frame unchanged', () => {
    const error = new Error('sync failure')
    error.stack = 'Error: sync failure\n    at https://cdn.example.test/assets/app.js:1:123'

    const frames = ErrorStackParser.parse(error)

    expect(frames.length).toBe(1)
    expect(frames[0].functionName).toBeUndefined()
    expect(frames[0].fileName).toBe('https://cdn.example.test/assets/app.js')
    expect(frames[0].lineNumber).toBe(1)
    expect(frames[0].columnNumber).toBe(123)
  })

  it('leaves an anonymous V8 frame in an anonymous script unchanged', () => {
    const error = new Error('sync failure')
    error.stack = 'Error: sync failure\n    at <anonymous>:1:41'

    const frames = ErrorStackParser.parse(error)

    expect(frames.length).toBe(1)
    expect(frames[0].functionName).toBeUndefined()
    expect(frames[0].fileName).toBeUndefined()
    expect(frames[0].lineNumber).toBe(1)
    expect(frames[0].columnNumber).toBe(41)
  })
})
