import plugin from '../'

import Client from '@bugsnag/core/client'

describe('plugin: interaction breadcrumbs', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div><button class="button">Click me</button></div>'
  })

  it('should be enabled by default', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(1)
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [], plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(0)
  })

  it('should be enabled when enabledBreadcrumbTypes=["user"]', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['user'], plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(1)
  })

  it('should be enabled when enabledBreadcrumbTypes=null', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin(window)] })

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.querySelector('button')!.click()

    expect(c._breadcrumbs).toHaveLength(1)
  })
})
