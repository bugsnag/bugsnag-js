// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../navigation-breadcrumbs')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: navigation breadcrumbs', () => {
  if ('addEventListener' in window) {
    it('should drop breadcrumb for navigational activity', done => {
      const c = new Client(VALID_NOTIFIER)
      c.configure({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
      c.use(plugin)
      // window.location = '#home'

      // mock a window#load event because the test env doesn't emit one
      const load = document.createEvent('Event')
      load.initEvent('load', true, true)
      window.dispatchEvent(load)

      const domLoad = document.createEvent('Event')
      domLoad.initEvent('DOMContentLoaded', true, true)
      window.document.dispatchEvent(domLoad)

      if (typeof Object.create === 'function' && window.history.replaceState) {
        var plainObject = Object.create(null)
        plainObject.dummyProperty = true
        var state = { myObject: plainObject }
        window.history.replaceState(state, 'foo', 'bar.html')
        expect(c.breadcrumbs.length).toBe(4)
        done()
      } else {
        // console.log(c.breadcrumbs)
        expect(c.breadcrumbs.length).toBe(3)
        done()
      }
    })
  }
})
