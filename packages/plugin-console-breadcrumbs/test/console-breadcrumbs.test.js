const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: console breadcrumbs', () => {
  it('should leave a breadcrumb when console.log() is called', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.configure()
    c.use(plugin)
    console.log('check 1, 2')
    // make sure it's null-safe
    console.log(null)
    console.log({
      foo: [ 1, 2, 3, 'four' ]
    }, {
      pets: {
        cat: 'scratcher',
        dog: 'pupper',
        rabbit: 'sniffer'
      }
    })
    expect(c.breadcrumbs.length).toBe(3)
    expect(c.breadcrumbs[0].metaData['[0]']).toBe('check 1, 2')
    expect(c.breadcrumbs[1].metaData['[0]']).toBe('null')
    expect(c.breadcrumbs[2].metaData['[0]']).toBe('{"foo":[1,2,3,"four"]}')
    expect(c.breadcrumbs[2].metaData['[1]']).toBe('{"pets":{"cat":"scratcher","dog":"pupper","rabbit":"sniffer"}}')
    // undo the global side effects of wrapping console.* for the rest of the tests
    plugin.destroy()
  })

  it('should not throw when an object without toString is logged', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.configure()
    c.use(plugin)
    expect(() => console.log(Object.create(null))).not.toThrow()
    plugin.destroy()
  })
})
