// magical jasmine globals
const { describe, it, expect } = global

const plugin = require('../navigation-breadcrumbs')

const Client = require('../../../base/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: navigation breadcrumbs', () => {
  if ('addEventListener' in window) {
    it('should drop breadcrumb for navigational activity', done => {
      let n = 1
      const c = new Client(VALID_NOTIFIER)
      c.configure({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
      c.use(plugin)
      // window.location = '#home'

      // mock a window#load event because the test env doesn't emit one
      const load = document.createEvent('Event')
      load.initEvent('load', true, true)
      window.dispatchEvent(load)
      n++

      const domLoad = document.createEvent('Event')
      domLoad.initEvent('DOMContentLoaded', true, true)
      window.document.dispatchEvent(domLoad)
      n++

      if (typeof Object.create === 'function' && window.history.replaceState) {
        var plainObject = Object.create(null)
        plainObject.dummyProperty = true
        var state = { myObject: plainObject }
        window.history.replaceState(state, 'foo', 'bar.html')
        n++
      }

      if (window.history.pushState) {
        // first ensure that the pushState command works to change the url of the page
        window.history.replaceState(state, 'bar', 'network-breadcrumb-test.html')
        expect(c.breadcrumbs[c.breadcrumbs.length - 1].metaData.to).toMatch(/^\/?network-breadcrumb-test\.html$/)
        expect(window.location.href).toMatch(/\/?network-breadcrumb-test\.html$/)
        n++

        window.history.replaceState(state, 'bar')
        // then ensure that it works with `undefined` as the url parameter (IE11-specific issue)
        expect(c.breadcrumbs[c.breadcrumbs.length - 1].metaData.to).toMatch(/^\/?network-breadcrumb-test\.html$/)
        n++
      }

      expect(c.breadcrumbs.length).toBe(n)

      done()
    })
  }
})
