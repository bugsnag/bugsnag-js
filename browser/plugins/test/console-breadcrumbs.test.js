// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../console-breadcrumbs')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: console breadcrumbs', () => {
  // At the time of writing, this test fails on the BrowserStack combo of OSX 10.13
  // and Safari 11. It works locally for OSX 10.12/13 and Safari 11 so something
  // odd is going on in the BrowserStack environment.
  if (!/Version\/11\.0 Safari/.test(window.navigator.userAgent)) {
    it('should leave a breadcrumb when console.log() is called', () => {
      const c = new Client(VALID_NOTIFIER)
      c.configure({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
      c.use(plugin)
      console.log('check 1, 2')
      expect(c.breadcrumbs.length).toBe(1)
      // undo the global side effects of wrapping console.* for the rest of the tests
      plugin.destroy()
    })
  }
})
