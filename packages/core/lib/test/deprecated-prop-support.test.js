const { describe, it, expect, spyOn } = global

const supportDeprecatedProps = require('../deprecated-prop-support')
const State = require('../state')

describe('deprecated prop support', () => {
  it('should provide support for setting properties', () => {
    const host = {
      state: new State(),
      _logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      },
      set (...args) {
        return this.state.set(...args)
      },
      get (...args) {
        return this.state.get(...args)
      }
    }
    const spy = spyOn(host._logger, 'error')
    supportDeprecatedProps(host, 'jim', [ 'app', 'metaData' ])
    host.app = { foo: 'bar' }
    expect(host.get('app', 'foo')).toBe('bar')
    expect(spy).toHaveBeenCalledWith(
      'Setting "jim.app" directly is no longer supported. Use "jim.set(\'app\', value)" instead.'
    )
  })

  it('should provide a special-case for metaData', () => {
    const host = {
      state: new State(),
      _logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      },
      set (...args) {
        return this.state.set(...args)
      },
      get (...args) {
        return this.state.get(...args)
      }
    }
    supportDeprecatedProps(host, 'jim', [ 'app', 'metaData' ])
    host.metaData = { foo: 'bar', tab: { entry: 1 } }
    expect(host.get('foo')).toBe('bar')
    expect(host.get('tab', 'entry')).toBe(1)
  })

  it('should provide support for getting properties', () => {
    const host = {
      state: new State(),
      _logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      },
      set (...args) {
        return this.state.set(...args)
      },
      get (...args) {
        return this.state.get(...args)
      }
    }
    supportDeprecatedProps(host, 'jim', [ 'app', 'metaData' ])
    host.app = { foo: 'bar' }
    expect(host.app.foo).toBe('bar')
  })

  it('doesn’t shim metaData', () => {
    const host = {
      state: new State(),
      _logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      },
      set (...args) {
        return this.state.set(...args)
      },
      get (...args) {
        return this.state.get(...args)
      }
    }
    supportDeprecatedProps(host, 'jim', [ 'app', 'metaData' ])
    host.metaData = { foo: 'bar' }
    expect(host.metaData).toBe(undefined)
  })
})
