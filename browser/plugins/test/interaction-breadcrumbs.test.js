// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../interaction-breadcrumbs')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: interaction breadcrumbs', () => {
  if ('addEventListener' in window) {
    it('should drop a breadcrumb when an element is clicked', () => {
      const c = new Client(VALID_NOTIFIER)
      c.configure({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
      c.use(plugin)
      const el = document.createElement('button')
      el.textContent = 'button of wonders!'
      document.body.appendChild(el)
      el.click()
      expect(c.breadcrumbs.length).toBe(1)
    })
  }
})
