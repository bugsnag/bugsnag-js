const { describe, it, expect } = global

const plugin = require('../navigation-breadcrumbs')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: navigation breadcrumbs', () => {
  it('should drop breadcrumb for navigational activity', done => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.configure()

    const { winHandlers, docHandlers, window } = getMockWindow()
    c.use(plugin, window)
    winHandlers['load'].forEach((h) => h.call(window))
    docHandlers['DOMContentLoaded'].forEach((h) => h.call(window.document))

    var plainObject = Object.create(null)
    plainObject.dummyProperty = true
    var state = { myObject: plainObject }
    window.history.replaceState(state, 'foo', 'bar.html')

    // first ensure that the pushState command works to change the url of the page
    window.history.replaceState(state, 'bar', 'network-breadcrumb-test.html')
    expect(c.breadcrumbs[c.breadcrumbs.length - 1].metaData.to).toMatch(/^\/?network-breadcrumb-test\.html$/)

    window.history.replaceState(state, 'bar')
    // then ensure that it works with `undefined` as the url parameter (IE11-specific issue)
    expect(c.breadcrumbs[c.breadcrumbs.length - 1].metaData.to).toMatch(/^\/?network-breadcrumb-test\.html$/)

    expect(c.breadcrumbs.length).toBe(6)

    done()
  })

  it('should not be enabled when autoBreadcrumbs=false', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false })
    c.configure()
    const { winHandlers, docHandlers, window } = getMockWindow()
    c.use(plugin, window)
    winHandlers['load'].forEach((h) => h.call(window))
    docHandlers['DOMContentLoaded'].forEach((h) => h.call(window.document))
    window.history.replaceState({}, 'bar', 'network-breadcrumb-test.html')
    window.history.replaceState({}, 'bar')
    expect(c.breadcrumbs.length).toBe(0)
  })

  it('should be enabled when autoBreadcrumbs=false and navigationBreadcrumbsEnabled=true', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false, navigationBreadcrumbsEnabled: true })
    c.configure()
    const { winHandlers, docHandlers, window } = getMockWindow()
    c.use(plugin, window)
    winHandlers['load'].forEach((h) => h.call(window))
    docHandlers['DOMContentLoaded'].forEach((h) => h.call(window.document))
    window.history.replaceState({}, 'bar', 'network-breadcrumb-test.html')
    window.history.replaceState({}, 'bar')
    expect(c.breadcrumbs.length).toBe(5)
  })
})

const getMockWindow = () => {
  const winHandlers = { load: [] }
  const docHandlers = { DOMContentLoaded: [] }

  // mock the window stuff this plugin uses
  const window = {
    document: {
      createElement: function (tag) {
        const el = { href: '' }
        Object.defineProperties(el, {
          pathname: {
            get: () => {
              const path = el.href.split('/').pop()
              return path ? `/${path.split('?')[0] || ''}` : ''
            }
          },
          search: {
            get: () => {
              const search = el.href.split('?')[1]
              return search ? `?${search.split('#')[0] || ''}` : ''
            }
          },
          hash: {
            get: () => {
              const hash = el.href.split('#')[1]
              return hash ? `#${hash}` : ''
            }
          }
        })
        return el
      },
      addEventListener: function (evt, handler) {
        docHandlers[evt] = docHandlers[evt] ? docHandlers[evt].concat(handler) : [ handler ]
      }
    },
    location: {
      href: 'https://app.bugsnag.com/errors'
    },
    history: {
      replaceState: function (state, title, url) {
        window.location.href = `https://app.bugsnag.com/${url}`
      },
      pushState: function () {},
      popState: function () {}
    },
    addEventListener: function (evt, handler) {
      winHandlers[evt] = winHandlers[evt] ? winHandlers[evt].concat(handler) : [ handler ]
    }
  }
  return { winHandlers, docHandlers, window }
}
