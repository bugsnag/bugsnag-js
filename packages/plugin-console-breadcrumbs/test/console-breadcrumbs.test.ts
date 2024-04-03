import plugin from '../'

import Client from '@bugsnag/core/client'

describe('plugin: console breadcrumbs', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should leave a breadcrumb when console.log() is called', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin] })
    console.log('check 1, 2')
    // make sure it's null-safe
    console.log(null)
    console.log({
      foo: [1, 2, 3, 'four']
    }, {
      pets: {
        cat: 'scratcher',
        dog: 'pupper',
        rabbit: 'sniffer'
      }
    })
    expect(c._breadcrumbs.length).toBe(3)
    expect(c._breadcrumbs[0].metadata['[0]']).toBe('check 1, 2')
    expect(c._breadcrumbs[1].metadata['[0]']).toBe('null')
    expect(c._breadcrumbs[2].metadata['[0]']).toBe('{"foo":[1,2,3,"four"]}')
    expect(c._breadcrumbs[2].metadata['[1]']).toBe('{"pets":{"cat":"scratcher","dog":"pupper","rabbit":"sniffer"}}')
    // undo the global side effects of wrapping console.* for the rest of the tests
    plugin.destroy()
  })

  it('should not throw when an object without toString is logged', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin] })
    expect(() => console.log(Object.create(null))).not.toThrow()
    expect(c._breadcrumbs.length).toBe(1)
    expect(c._breadcrumbs[0].message).toBe('Console output')
    expect(c._breadcrumbs[0].metadata['[0]']).toBe('[Unknown value]')
    plugin.destroy()
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [], plugins: [plugin] })
    console.log(123)
    expect(c._breadcrumbs.length).toBe(0)
    plugin.destroy()
  })

  it('should be enabled when enabledBreadcrumbTypes=null', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin] })
    console.log(123)
    expect(c._breadcrumbs).toHaveLength(1)
    plugin.destroy()
  })

  it('should be enabled when enabledBreadcrumbTypes=["log"]', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['log'], plugins: [plugin] })
    console.log(123)
    expect(c._breadcrumbs.length).toBe(1)
    plugin.destroy()
  })

  it('should be not enabled by default when releaseStage=development', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', releaseStage: 'development', plugins: [plugin] })
    console.log(123)
    expect(c._breadcrumbs.length).toBe(0)
    plugin.destroy()
  })

  it('should be not enabled by default when releaseStage=dev', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', releaseStage: 'dev', plugins: [plugin] })
    console.log(123)
    expect(c._breadcrumbs.length).toBe(0)
    plugin.destroy()
  })

  it('should be not enabled by default when releaseStage=local-dev', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', releaseStage: 'local-dev', plugins: [plugin] })
    console.log(123)
    expect(c._breadcrumbs.length).toBe(0)
    plugin.destroy()
  })

  it('should use the client from the async context if it exists', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin] })
    const contextClient = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin] })
    c._clientContext = {
      getStore: () => contextClient
    }
    console.log(123)
    expect(c._breadcrumbs.length).toBe(0)
    expect(c._clientContext.getStore()._breadcrumbs.length).toBe(2)
    plugin.destroy()
  })
})
