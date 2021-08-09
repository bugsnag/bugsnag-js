import { NativeClient } from '..'

describe('handling poor inputs', () => {
  beforeAll(() => NativeClient.install('/tmp/file.json', '/tmp/last-run-info.json', 10))

  afterAll(() => NativeClient.uninstall())

  it('rejects invalid types in user data', () => {
    const update = () => NativeClient.updateUser(4, null, null)
    expect(update).toThrow('expected string')
  })

  it('rejects invalid data type for context', () => {
    const update = () => NativeClient.updateContext(2.0)
    expect(update).toThrow('expected string')
  })

  it('rejects invalid data type for breadcrumb (float)', () => {
    const update = () => NativeClient.leaveBreadcrumb(2.0)
    expect(update).toThrow('expected object or string')
  })

  it('rejects invalid data type for metadata', () => {
    let update = () => NativeClient.updateMetadata([], { key: 'value' })
    expect(update).toThrow('expected object')

    update = () => NativeClient.updateMetadata(null)
    expect(update).toThrow('expected (object) or (string, object?)')
  })

  it('rejects invalid data type for breadcrumb (int)', () => {
    const update = () => NativeClient.leaveBreadcrumb(80)
    expect(update).toThrow('expected object or string')
  })

  it('rejects invalid data type for session', () => {
    const update = () => NativeClient.setSession([])
    expect(update).toThrow('expected object')
  })

  it('rejects invalid data type for device', () => {
    const update = () => NativeClient.setDevice(6.1)
    expect(update).toThrow('expected object')
  })

  it('rejects invalid data type for app', () => {
    const update = () => NativeClient.setApp(80)
    expect(update).toThrow('expected object')
  })

  it('rejects missing parameters in setUser()', () => {
    const update = () => NativeClient.updateUser('34', 'jan@example.com')
    expect(update).toThrow('Wrong number of arguments, expected 3')
  })

  it('rejects missing parameters in leaveBreadcrumb()', () => {
    const update = () => NativeClient.leaveBreadcrumb()
    expect(update).toThrow('Wrong number of arguments, expected 1')
  })

  it('rejects missing parameters in updateMetadata()', () => {
    const update = () => NativeClient.updateMetadata()
    expect(update).toThrow('Wrong number of arguments, expected 1 or 2')
  })

  it('rejects missing parameters in updateContext()', () => {
    const update = () => NativeClient.updateContext()
    expect(update).toThrow('Wrong number of arguments, expected 1')
  })

  it('rejects missing parameters in setApp()', () => {
    const update = () => NativeClient.setApp()
    expect(update).toThrow('Wrong number of arguments, expected 1')
  })

  it('rejects missing parameters in setDevice()', () => {
    const update = () => NativeClient.setDevice()
    expect(update).toThrow('Wrong number of arguments, expected 1')
  })

  it('rejects missing parameters in setSession()', () => {
    const update = () => NativeClient.setDevice()
    expect(update).toThrow('Wrong number of arguments, expected 1')
  })
})
