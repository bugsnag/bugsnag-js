import * as bindings from 'bindings'

describe('handling poor inputs', () => {
  const NativeClient = bindings.default('bugsnag_plugin_electron_client_sync_bindings')

  beforeAll(() => NativeClient.install('/tmp/file.json', 10))

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

  it('rejects invalid data type for metadata tab field', () => {
    const update = () => NativeClient.addMetadata([], 'key', 'value')
    expect(update).toThrow('expected string')
  })

  it('rejects invalid data type for metadata key field', () => {
    const update = () => NativeClient.addMetadata('tab', 2, 'value')
    expect(update).toThrow('expected string')
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

  it('rejects missing parameters in addMetadata()', () => {
    const update = () => NativeClient.addMetadata('meals', 'breakfast')
    expect(update).toThrow('Wrong number of arguments, expected 3')
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
