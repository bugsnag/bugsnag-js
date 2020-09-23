import Plugin from '../'
import Client from '@bugsnag/core/client'
import TestRenderer from 'react-test-renderer'
import * as React from 'react'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'

jest.mock('@react-navigation/native')

afterEach(() => jest.clearAllMocks())

describe('plugin: react navigation', () => {
  it('should pass through props and ref to the underlying NavigationContainer', done => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [new Plugin()] })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const BugsnagNavigationContainer = c.getPlugin('reactNavigation')!.createNavigationContainer(NavigationContainer)
    expect(BugsnagNavigationContainer).toBeTruthy()
    const onReady = jest.fn()
    const onStateChange = jest.fn()
    let ref
    const App = () => {
      ref = React.useRef(null)
      return (
        <BugsnagNavigationContainer ref={ref} onReady={onReady} onStateChange={onStateChange}>
          Testing 123
        </BugsnagNavigationContainer>
      )
    }

    const MockedNavigationContainerRender = (NavigationContainer as any).render as jest.MockedFunction<React.ForwardRefRenderFunction<any, any>>
    TestRenderer.create(<App/>)

    expect(MockedNavigationContainerRender).toBeCalledTimes(1)

    MockedNavigationContainerRender.mock.calls[0][0].onReady()
    expect(onReady).toBeCalledTimes(1)

    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()
    expect(onStateChange).toBeCalledTimes(1)

    expect(MockedNavigationContainerRender.mock.calls[0][1]).toBe(ref)

    done()
  })

  it('should update context when the screen changes', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [new Plugin()] })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const BugsnagNavigationContainer = c.getPlugin('reactNavigation')!.createNavigationContainer(NavigationContainer)
    let ref
    let currentRouteName = 'home'
    const App = () => {
      ref = React.useRef({
        getCurrentRoute: () => {
          return { name: currentRouteName }
        }
      })
      return (
        <BugsnagNavigationContainer ref={ref as unknown as React.RefObject<NavigationContainerRef>}>
          Testing 123
        </BugsnagNavigationContainer>
      )
    }

    const MockedNavigationContainerRender = (NavigationContainer as any).render as jest.MockedFunction<React.ForwardRefRenderFunction<any, any>>
    TestRenderer.create(<App/>)

    expect(MockedNavigationContainerRender).toBeCalledTimes(1)

    expect(c.getContext()).toBeUndefined()

    MockedNavigationContainerRender.mock.calls[0][0].onReady()
    expect(c.getContext()).toBe('home')

    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()
    expect(c.getContext()).toBe('home')

    currentRouteName = 'details'
    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()
    expect(c.getContext()).toBe('details')
  })

  it('should leave breacrumbs when the screen changes', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [new Plugin()] })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const BugsnagNavigationContainer = c.getPlugin('reactNavigation')!.createNavigationContainer(NavigationContainer)
    let ref
    let currentRouteName = 'home'
    const App = () => {
      ref = React.useRef({
        getCurrentRoute: () => {
          return { name: currentRouteName }
        }
      })
      return (
        <BugsnagNavigationContainer ref={ref as unknown as React.RefObject<NavigationContainerRef>}>
          Testing 123
        </BugsnagNavigationContainer>
      )
    }

    const MockedNavigationContainerRender = (NavigationContainer as any).render as jest.MockedFunction<React.ForwardRefRenderFunction<any, any>>
    TestRenderer.create(<App/>)

    expect(MockedNavigationContainerRender).toBeCalledTimes(1)

    expect(c._breadcrumbs.length).toBe(0)

    MockedNavigationContainerRender.mock.calls[0][0].onReady()
    currentRouteName = 'details'
    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()
    currentRouteName = 'settings'
    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()
    currentRouteName = 'details'
    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()

    expect(c._breadcrumbs.length).toBe(3)

    expect(c._breadcrumbs[0].message).toBe('React Navigation onStateChange')
    expect(c._breadcrumbs[0].metadata.from).toBe('home')
    expect(c._breadcrumbs[0].metadata.to).toBe('details')

    expect(c._breadcrumbs[1].message).toBe('React Navigation onStateChange')
    expect(c._breadcrumbs[1].metadata.from).toBe('details')
    expect(c._breadcrumbs[1].metadata.to).toBe('settings')

    expect(c._breadcrumbs[2].message).toBe('React Navigation onStateChange')
    expect(c._breadcrumbs[2].metadata.from).toBe('settings')
    expect(c._breadcrumbs[2].metadata.to).toBe('details')
  })

  it('should leave no breacrumbs when navigation breadcrumbs are disabled', () => {
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa', plugins: [new Plugin()], enabledBreadcrumbTypes: [] })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const BugsnagNavigationContainer = c.getPlugin('reactNavigation')!.createNavigationContainer(NavigationContainer)
    let ref
    let currentRouteName = 'home'
    const App = () => {
      ref = React.useRef({
        getCurrentRoute: () => {
          return { name: currentRouteName }
        }
      })
      return (
        <BugsnagNavigationContainer ref={ref as unknown as React.RefObject<NavigationContainerRef>}>
          Testing 123
        </BugsnagNavigationContainer>
      )
    }

    const MockedNavigationContainerRender = (NavigationContainer as any).render as jest.MockedFunction<React.ForwardRefRenderFunction<any, any>>
    TestRenderer.create(<App/>)

    expect(MockedNavigationContainerRender).toBeCalledTimes(1)

    expect(c._breadcrumbs.length).toBe(0)

    MockedNavigationContainerRender.mock.calls[0][0].onReady()
    currentRouteName = 'details'
    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()
    currentRouteName = 'settings'
    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()
    currentRouteName = 'details'
    MockedNavigationContainerRender.mock.calls[0][0].onStateChange()

    expect(c._breadcrumbs.length).toBe(0)
  })
})
