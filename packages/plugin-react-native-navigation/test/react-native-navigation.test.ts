import Plugin from '../react-native-navigation'
import { Breadcrumb } from '@bugsnag/core'
import Client from '@bugsnag/core/client'

interface Event {
  componentId: number
  componentName: string
  passProps: object
}

describe('plugin-react-native-navigation', () => {
  it('should throw when Navigation is not passed', () => {
    const message = '@bugsnag/plugin-react-native-navigation reference to `Navigation` was undefined'

    expect(() => new Plugin()).toThrow(new Error(message))
  })

  it('adds an event listener on load', () => {
    const spy = jest.fn()

    const Navigation = {
      events () {
        return { registerComponentDidAppearListener: spy }
      }
    }

    const plugin = new Plugin(Navigation)

    expect(spy).not.toHaveBeenCalled()

    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin] })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(client.getContext()).toBe(undefined)
  })

  it('updates the client context when the listener is triggered', () => {
    // Setup a fake listener that should never be called - the plugin should
    // replace this on load by calling 'registerComponentDidAppearListener'
    let listener = (event: Event) => {
      throw new Error(`This function was not supposed to be called! ${event.componentName}`)
    }

    const Navigation = {
      events () {
        return {
          registerComponentDidAppearListener (callback: (event: Event) => never) {
            listener = callback
          }
        }
      }
    }

    const plugin = new Plugin(Navigation)
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin] })

    expect(client.getContext()).toBe(undefined)

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(client.getContext()).toBe('abc xyz')

    listener({ componentId: 2, componentName: 'xyz abc', passProps: {} })

    expect(client.getContext()).toBe('xyz abc')
  })

  it('leaves a breadcrumb when the listener is triggered', () => {
    let listener = (event: Event) => {
      throw new Error(`This function was not supposed to be called! ${event.componentName}`)
    }

    const Navigation = {
      events () {
        return {
          registerComponentDidAppearListener (callback: (event: Event) => never) {
            listener = callback
          }
        }
      }
    }

    const breadcrumbs: Breadcrumb[] = []

    const plugin = new Plugin(Navigation)
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin] })
    client.addOnBreadcrumb(breadcrumb => { breadcrumbs.push(breadcrumb) })

    expect(breadcrumbs.length).toBe(0)

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(breadcrumbs.length).toBe(1)
    expect(breadcrumbs[0].message).toBe('React Native Navigation componentDidAppear')
    expect(breadcrumbs[0].metadata).toStrictEqual({ to: 'abc xyz', from: undefined })
    expect(breadcrumbs[0].type).toBe('navigation')

    listener({ componentId: 2, componentName: 'xyz abc', passProps: {} })

    expect(breadcrumbs.length).toBe(2)
    expect(breadcrumbs[1].message).toBe('React Native Navigation componentDidAppear')
    expect(breadcrumbs[1].metadata).toStrictEqual({ to: 'xyz abc', from: 'abc xyz' })
    expect(breadcrumbs[1].type).toBe('navigation')
  })

  it('leaves a breadcrumb when enabledBreadcrumbTypes=null', () => {
    let listener = (event: Event) => {
      throw new Error(`This function was not supposed to be called! ${event.componentName}`)
    }

    const Navigation = {
      events () {
        return {
          registerComponentDidAppearListener (callback: (event: Event) => never) {
            listener = callback
          }
        }
      }
    }

    const breadcrumbs: Breadcrumb[] = []

    const plugin = new Plugin(Navigation)
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin], enabledBreadcrumbTypes: null })
    client.addOnBreadcrumb(breadcrumb => { breadcrumbs.push(breadcrumb) })

    expect(breadcrumbs).toHaveLength(0)

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(breadcrumbs).toHaveLength(1)
    expect(breadcrumbs[0].message).toBe('React Native Navigation componentDidAppear')
    expect(breadcrumbs[0].metadata).toStrictEqual({ to: 'abc xyz', from: undefined })
    expect(breadcrumbs[0].type).toBe('navigation')

    listener({ componentId: 2, componentName: 'xyz abc', passProps: {} })

    expect(breadcrumbs).toHaveLength(2)
    expect(breadcrumbs[1].message).toBe('React Native Navigation componentDidAppear')
    expect(breadcrumbs[1].metadata).toStrictEqual({ to: 'xyz abc', from: 'abc xyz' })
    expect(breadcrumbs[1].type).toBe('navigation')
  })

  it('does not leave a breadcrumb when the component has not changed', () => {
    let listener = (event: Event) => {
      throw new Error(`This function was not supposed to be called! ${event.componentName}`)
    }

    const Navigation = {
      events () {
        return {
          registerComponentDidAppearListener (callback: (event: Event) => never) {
            listener = callback
          }
        }
      }
    }

    const breadcrumbs: Breadcrumb[] = []

    const plugin = new Plugin(Navigation)
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin] })
    client.addOnBreadcrumb(breadcrumb => { breadcrumbs.push(breadcrumb) })

    expect(breadcrumbs.length).toBe(0)

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(breadcrumbs.length).toBe(1)
    expect(breadcrumbs[0].message).toBe('React Native Navigation componentDidAppear')
    expect(breadcrumbs[0].metadata).toStrictEqual({ to: 'abc xyz', from: undefined })
    expect(breadcrumbs[0].type).toBe('navigation')

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(breadcrumbs.length).toBe(1)

    listener({ componentId: 1, componentName: 'xyz abc', passProps: {} })

    expect(breadcrumbs.length).toBe(2)
    expect(breadcrumbs[1].message).toBe('React Native Navigation componentDidAppear')
    expect(breadcrumbs[1].metadata).toStrictEqual({ to: 'xyz abc', from: 'abc xyz' })
    expect(breadcrumbs[1].type).toBe('navigation')

    listener({ componentId: 1, componentName: 'xyz abc', passProps: {} })

    expect(breadcrumbs.length).toBe(2)
  })

  it('does not leave a breadcrumb when the "navigation" breadcrumb type is disabled', () => {
    let listener = (event: Event) => {
      throw new Error(`This function was not supposed to be called! ${event.componentName}`)
    }

    const Navigation = {
      events () {
        return {
          registerComponentDidAppearListener (callback: (event: Event) => never) {
            listener = callback
          }
        }
      }
    }

    const breadcrumbs: Breadcrumb[] = []

    const plugin = new Plugin(Navigation)
    const client = new Client({
      apiKey: 'API_KEY_YEAH',
      plugins: [plugin],
      enabledBreadcrumbTypes: ['request', 'process', 'log', 'user', 'state', 'error', 'manual']
    })

    client.addOnBreadcrumb(breadcrumb => { breadcrumbs.push(breadcrumb) })

    expect(breadcrumbs.length).toBe(0)

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(breadcrumbs.length).toBe(0)

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(breadcrumbs.length).toBe(0)

    listener({ componentId: 1, componentName: 'abc xyz', passProps: {} })

    expect(breadcrumbs.length).toBe(0)
  })
})
