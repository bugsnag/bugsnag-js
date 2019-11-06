const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: console breadcrumbs', () => {
  it('should leave a breadcrumb when console.log() is called', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    console.log('check 1, 2')
    // make sure it's null-safe
    console.log(null)
    console.log({
      foo: [1, 2, 3, 'four']
    }, {
      pets: {
        cat: 'scratcher',
        dog: 'pupper',
        rabbit: 'sniffer'
      }
    })
    expect(c._breadcrumbs.length).toBe(3)
    expect(c._breadcrumbs[0].metadata['[0]']).toBe('check 1, 2')
    expect(c._breadcrumbs[1].metadata['[0]']).toBe('null')
    expect(c._breadcrumbs[2].metadata['[0]']).toBe('{"foo":[1,2,3,"four"]}')
    expect(c._breadcrumbs[2].metadata['[1]']).toBe('{"pets":{"cat":"scratcher","dog":"pupper","rabbit":"sniffer"}}')
    // undo the global side effects of wrapping console.* for the rest of the tests
    plugin.destroy()
  })

  it('should not throw when an object without toString is logged', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    expect(() => console.log(Object.create(null))).not.toThrow()
    expect(c._breadcrumbs.length).toBe(1)
    expect(c._breadcrumbs[0].message).toBe('Console output')
    expect(c._breadcrumbs[0].metadata['[0]']).toBe('[Unknown value]')
    plugin.destroy()
  })

  it('should not be enabled when enabledBreadcrumbTypes=null', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    console.log(123)
    expect(c._breadcrumbs.length).toBe(0)
    plugin.destroy()
  })

  it('should be enabled when enabledBreadcrumbTypes=["log"]', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['log'] }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    console.log(123)
    expect(c._breadcrumbs.length).toBe(1)
    plugin.destroy()
  })

  it('should be not enabled by default when releaseStage=development', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', releaseStage: 'development' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    console.log(123)
    expect(c._breadcrumbs.length).toBe(0)
    plugin.destroy()
  })
})
