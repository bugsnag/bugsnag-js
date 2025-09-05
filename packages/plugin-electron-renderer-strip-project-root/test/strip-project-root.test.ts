import { Event } from '@bugsnag/core'
import plugin from '..'
import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'

const isWindows = process.platform === 'win32'

describe('plugin: stack frame file trimmer', () => {
  it('converts file URLs into paths', async () => {
    const file = isWindows ? 'file:///D:/path/to/index.js' : 'file:///path/to/index.js'
    const expected = isWindows ? 'D:/path/to/index.js' : '/path/to/index.js'
    const event = await sendEvent({ file })
    expect(event.errors[0].stacktrace[0]).toEqual({ file: expected })
  })

  it('does not truncate file paths without project root', async () => {
    const file = isWindows ? 'D:/path/to/renderer.js' : '/path/to/renderer.js'
    const event = await sendEvent({ file })
    expect(event.errors[0].stacktrace[0]).toEqual({ file })
  })

  it('ignores frames without the file property', async () => {
    const event = await sendEvent({ method: 'go' })
    expect(event.errors[0].stacktrace[0]).toEqual({ method: 'go' })
  })

  it('strips projectRoot from file URLs', async () => {
    const file = isWindows ? 'file:///D:/path/to/index.js' : 'file:///path/to/index.js'
    const expected = 'to/index.js'
    const projectRoot = isWindows ? 'D:\\path\\' : '/path/'
    const event = await sendEvent({ file }, projectRoot)
    expect(event.errors[0].stacktrace[0]).toEqual({ file: expected })
  })

  it('strips project root from file paths', async () => {
    const file = isWindows ? 'D:/path/to/index.js' : '/path/to/index.js'
    const expected = 'to/index.js'
    const projectRoot = isWindows ? 'D:\\path\\' : '/path/'
    const event = await sendEvent({ file }, projectRoot)
    expect(event.errors[0].stacktrace[0]).toEqual({ file: expected })
  })

  it('decodes escaped URI characters', async () => {
    const file = isWindows
      ? 'file:///D:/Program%20Files/electron%20app/electron-app-win-32/app.js'
      : 'file:///Applications/electron%20app/electron-app-darwin-x64/app.js'
    const expected = 'app.js'
    const projectRoot = isWindows
      ? 'D:\\Program Files\\electron app\\electron-app-win-32\\'
      : '/Applications/electron app/electron-app-darwin-x64/'
    const event = await sendEvent({ file }, projectRoot)
    expect(event.errors[0].stacktrace[0]).toEqual({ file: expected })
  })
})

async function sendEvent (initialStackframe: any, projectRoot: string|null = null) {
  const config = { projectRoot }
  const schema = { projectRoot: { defaultValue: () => null, validate: () => true } }
  const { client, sendEvent } = makeClientForPlugin({ config, schema, plugins: [plugin] })
  client.addOnError((event: Event) => {
    event.errors[0].stacktrace = [initialStackframe]
  }, true)
  return sendEvent()
}
