const { describe, it, expect } = global

const plugin = require('../')

const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: interaction breadcrumbs', () => {
  it('should drop a breadcrumb when an element is clicked', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa' })
    c.configure()
    const { window, winHandlers, els } = getMockWindow()
    c.use(plugin, window)
    winHandlers['click'].forEach(fn => fn.call(window, { target: els[0] }))
    expect(c.breadcrumbs.length).toBe(1)
  })

  it('should not be enabled when autoBreadcrumbs=false', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false })
    c.configure()
    const { window, winHandlers, els } = getMockWindow()
    c.use(plugin, window)
    winHandlers['click'].forEach(fn => fn.call(window, { target: els[0] }))
    expect(c.breadcrumbs.length).toBe(0)
  })

  it('should be enabled when autoBreadcrumbs=false and interactionBreadcrumbsEnabled=true', () => {
    const c = new Client(VALID_NOTIFIER)
    c.setOptions({ apiKey: 'aaaa-aaaa-aaaa-aaaa', autoBreadcrumbs: false, interactionBreadcrumbsEnabled: true })
    c.configure()
    const { window, winHandlers, els } = getMockWindow()
    c.use(plugin, window)
    winHandlers['click'].forEach(fn => fn.call(window, { target: els[0] }))
    expect(c.breadcrumbs.length).toBe(1)
  })
})

const getMockWindow = () => {
  const els = [
    {
      tagName: 'BUTTON',
      className: 'button',
      textContent: 'Click me',
      parentNode: null
    },
    {
      tagName: 'BUTTON',
      className: 'button',
      textContent: 'or me',
      parentNode: null
    }
  ]

  const parent = {
    tagName: 'DIV',
    id: 'buttons',
    childNodes: els,
    className: '',
    parentNode: null
  }

  parent.parentNode = { childNodes: [ parent ] }
  els.forEach(el => { el.parentNode = parent })

  let winHandlers = { 'click': [] }
  const window = {
    addEventListener: function (evt, handler) {
      winHandlers[evt] = winHandlers[evt] ? winHandlers[evt].concat(handler) : [ handler ]
    },
    document: {
      querySelectorAll: function (query) {
        switch (query) {
          case 'BUTTON.button': return els
          case 'BUTTON.button:nth-child(1)': return [ els[0] ]
          case 'DIV#buttons': return [ parent ]
          default: return []
        }
      }
    }
  }
  return { els, window, winHandlers }
}
