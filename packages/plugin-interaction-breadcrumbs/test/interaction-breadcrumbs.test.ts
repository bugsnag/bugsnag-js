import plugin from '../'

import Client from '@bugsnag/core/client'

describe('plugin: interaction breadcrumbs', () => {
  it('should drop a breadcrumb when an element is clicked', () => {
    const { window, winHandlers, els } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin(window)] })
    winHandlers.click.forEach(fn => fn.call(window, { target: els[0] }))
    expect(c._breadcrumbs.length).toBe(1)
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    const { window, winHandlers, els } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [], plugins: [plugin(window)] })
    winHandlers.click.forEach(fn => fn.call(window, { target: els[0] }))
    expect(c._breadcrumbs.length).toBe(0)
  })

  it('should be enabled when enabledBreadcrumbTypes=["user"]', () => {
    const { window, winHandlers, els } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['user'], plugins: [plugin(window)] })
    winHandlers.click.forEach(fn => fn.call(window, { target: els[0] }))
    expect(c._breadcrumbs.length).toBe(1)
  })

  it('should be enabled when enabledBreadcrumbTypes=null', () => {
    const { window, winHandlers, els } = getMockWindow()
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })
    winHandlers.click.forEach(fn => fn.call(window, { target: els[0] }))
    expect(c._breadcrumbs.length).toBe(1)
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
  } as any

  parent.parentNode = { childNodes: [parent] }
  els.forEach(el => { el.parentNode = parent })

  const winHandlers: { [key: string]: Array<(event: any) => void> } = { click: [] }
  const window = {
    addEventListener: function (evt: string, handler: (event: any) => void) {
      winHandlers[evt] = winHandlers[evt] ? winHandlers[evt].concat(handler) : [handler]
    },
    document: {
      querySelectorAll: function (query: string) {
        switch (query) {
          case 'BUTTON.button': return els
          case 'BUTTON.button:nth-child(1)': return [els[0]]
          case 'DIV#buttons': return [parent]
          default: return []
        }
      }
    }
  } as unknown as Window & typeof globalThis

  return { els, window, winHandlers }
}
