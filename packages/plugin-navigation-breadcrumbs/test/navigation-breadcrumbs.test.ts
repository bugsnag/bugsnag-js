import plugin from '../src/navigation-breadcrumbs'

import Client from '@bugsnag/core/client'

const noop = () => {}
const id = <T>(a: T) => a

describe('plugin: navigation breadcrumbs', () => {
  it('should drop breadcrumb for navigational activity', done => {
    const { winHandlers, docHandlers, window } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin(window)] })
    c._sessionDelegate = {
      startSession: id,
      pauseSession: noop,
      resumeSession: id
    }

    winHandlers.load.forEach((h) => h.call(window))
    docHandlers.DOMContentLoaded.forEach((h) => h.call(window.document))

    const plainObject = Object.create(null)
    plainObject.dummyProperty = true
    const state = { myObject: plainObject }
    window.history.replaceState(state, 'foo', 'bar.html')

    // first ensure that the pushState command works to change the url of the page
    window.history.replaceState(state, 'bar', 'network-breadcrumb-test.html')
    expect(c._breadcrumbs[c._breadcrumbs.length - 1].metadata.to).toMatch(/^\/?network-breadcrumb-test\.html$/)

    window.history.replaceState(state, 'bar')
    // then ensure that it works with `undefined` as the url parameter (IE11-specific issue)
    expect(c._breadcrumbs[c._breadcrumbs.length - 1].metadata.to).toMatch(/^\/?network-breadcrumb-test\.html$/)

    expect(c._breadcrumbs.length).toBe(5)

    done()
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    const { winHandlers, docHandlers, window } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [], plugins: [plugin(window)] })
    c._sessionDelegate = {
      startSession: id,
      pauseSession: noop,
      resumeSession: id
    }
    winHandlers.load.forEach((h) => h.call(window))
    docHandlers.DOMContentLoaded.forEach((h) => h.call(window.document))
    window.history.replaceState({}, 'bar', 'network-breadcrumb-test.html')
    window.history.replaceState({}, 'bar')
    expect(c._breadcrumbs.length).toBe(0)
  })

  it('should not start a new session if autoTrackSessions=false', () => {
    const { winHandlers, docHandlers, window } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoTrackSessions: false, plugins: [plugin(window)] })
    c._sessionDelegate = {
      startSession: jest.fn(),
      pauseSession: noop,
      resumeSession: id
    }
    winHandlers.load.forEach((h) => h.call(window))
    docHandlers.DOMContentLoaded.forEach((h) => h.call(window.document))
    window.history.replaceState({}, 'bar', 'network-breadcrumb-test.html')
    expect(c._sessionDelegate.startSession).not.toHaveBeenCalled()
  })

  it('should be enabled when enabledBreadcrumbTypes=["navigation"]', () => {
    const { winHandlers, docHandlers, window } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['navigation'], plugins: [plugin(window)] })
    c._sessionDelegate = {
      startSession: id,
      pauseSession: noop,
      resumeSession: id
    }
    winHandlers.load.forEach((h) => h.call(window))
    docHandlers.DOMContentLoaded.forEach((h) => h.call(window.document))
    window.history.replaceState({}, 'bar', 'network-breadcrumb-test.html')
    window.history.replaceState({}, 'bar')
    expect(c._breadcrumbs.length).toBe(4)
  })

  it('should be enabled when enabledBreadcrumbTypes=null', () => {
    const { winHandlers, docHandlers, window } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })
    c._sessionDelegate = {
      startSession: id,
      pauseSession: noop,
      resumeSession: id
    }
    winHandlers.load.forEach((h) => h.call(window))
    docHandlers.DOMContentLoaded.forEach((h) => h.call(window.document))
    window.history.replaceState({}, 'bar', 'network-breadcrumb-test.html')
    window.history.replaceState({}, 'bar')
    expect(c._breadcrumbs.length).toBe(4)
  })
})

const getMockWindow = () => {
  const winHandlers: { [eventName: string]: Array<() => void>} = { load: [] }
  const docHandlers: { [eventName: string]: Array<() => void> } = { DOMContentLoaded: [] }

  // mock the window stuff this plugin uses
  const window = {
    document: {
      createElement: function (tag: string) {
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
      addEventListener: function (evt: string, handler: () => void) {
        docHandlers[evt] = docHandlers[evt] ? docHandlers[evt].concat(handler) : [handler]
      }
    },
    location: {
      href: 'https://app.bugsnag.com/errors'
    },
    history: {
      replaceState: function (state: {}, title: string, url: string) {
        window.location.href = `https://app.bugsnag.com/${url}`
      },
      pushState: function () {},
      popState: function () {}
    },
    addEventListener: function (evt: string, handler: () => void) {
      winHandlers[evt] = winHandlers[evt] ? winHandlers[evt].concat(handler) : [handler]
    }
  } as unknown as Window & typeof globalThis
  return { winHandlers, docHandlers, window }
}
