import Client from '@bugsnag/core/client'
import plugin from '..'

// @types/react-native conflicts with lib dom so disable ts for
// react-native imports until a better solution is found.
// See DefinitelyTyped/DefinitelyTyped#33311
// @ts-ignore
import { Dimensions } from 'react-native'

jest.mock('react-native', () => ({
  Dimensions: {
    get: () => ({ height: 0, width: 0 }),
    addEventListener: jest.fn()
  }
}))

const MockDimensions: jest.Mocked<any> = Dimensions

describe('plugin: react native orientation breadcrumbs', () => {
  beforeEach(() => {
    MockDimensions.addEventListener.mockReset()
  })

  it('should create a breadcrumb when the Dimensions#change event happens', () => {
    MockDimensions.get = () => ({ height: 100, width: 200 })
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [plugin] })

    const cb = MockDimensions.addEventListener.mock.calls[0][1]
    expect(MockDimensions.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(client._breadcrumbs.length).toBe(0)

    MockDimensions.get = () => ({ height: 200, width: 100 })
    cb()
    expect(client._breadcrumbs.length).toBe(1)
    expect(client._breadcrumbs[0].message).toBe('Orientation changed')
    expect(client._breadcrumbs[0].metadata).toEqual({ from: 'landscape', to: 'portrait' })

    MockDimensions.get = () => ({ height: 200, width: 100 })
    cb()
    expect(client._breadcrumbs.length).toBe(1)

    MockDimensions.get = () => ({ height: 100, width: 200 })
    cb()
    expect(client._breadcrumbs.length).toBe(2)
    expect(client._breadcrumbs[1].message).toBe('Orientation changed')
    expect(client._breadcrumbs[1].metadata).toEqual({ from: 'portrait', to: 'landscape' })
  })

  it('should be enabled when enabledBreadcrumbTypes=null', () => {
    MockDimensions.get = () => ({ height: 100, width: 200 })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: null, plugins: [plugin] })

    expect(MockDimensions.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(client).toBe(client)
  })

  it('should not be enabled when enabledBreadcrumbTypes=[]', () => {
    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: [], plugins: [plugin] })

    expect(MockDimensions.addEventListener).not.toHaveBeenCalled()
    expect(client).toBe(client)
  })

  it('should be enabled when enabledBreadcrumbTypes=["state"]', () => {
    MockDimensions.get = () => ({ height: 100, width: 200 })

    const client = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', enabledBreadcrumbTypes: ['state'], plugins: [plugin] })

    expect(MockDimensions.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(client).toBe(client)
  })
})
