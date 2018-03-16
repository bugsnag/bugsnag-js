// magical jasmine globals
const { XMLHttpRequest } = window
const { describe, it, expect } = global

const plugin = require('../network-breadcrumbs')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: network breadcrumbs', () => {
  it('should leave a breadcrumb when an XMLHTTPRequest resolves', (done) => {
    const c = new Client(VALID_NOTIFIER)
    c.configure({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.use(plugin)
    const request = new XMLHttpRequest()
    request.open('GET', '/')

    request.addEventListener('load', () => {
      expect(c.breadcrumbs.length).toBe(1)
      done()
    })

    request.send()

    // undo the global side effects
    plugin.destroy()
  })
})
