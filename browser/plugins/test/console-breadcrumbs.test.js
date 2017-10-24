// shim the env for ye olde browsers
require('core-js')

// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../console-breadcrumbs')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: console breadcrumbs', () => {
  it('should have a name and description', () => {
    expect(plugin.name).toBe('console breadcrumbs')
  })

  it('should leave a breadcrumb when console.log() is called', () => {
    const c = new Client(VALID_NOTIFIER)
    c.configure({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.use(plugin)
    console.log('check 1, 2')
    expect(c.breadcrumbs.length).toBe(1)
    // undo the global side effects of wrapping console.* for the rest of the tests
    plugin.destroy()
  })
})
