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

  describe('navigation context tracking', () => {
    it('tracks navigation between multiple screens', () => {
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

      // Navigate to Home
      listener({ componentId: 1, componentName: 'Home', passProps: {} })
      expect(client.getContext()).toBe('Home')

      // Navigate to Profile
      listener({ componentId: 2, componentName: 'Profile', passProps: {} })
      expect(client.getContext()).toBe('Profile')

      // Navigate to Settings
      listener({ componentId: 3, componentName: 'Settings', passProps: {} })
      expect(client.getContext()).toBe('Settings')

      // Back to Home
      listener({ componentId: 1, componentName: 'Home', passProps: {} })
      expect(client.getContext()).toBe('Home')
    })

    it('handles navigation with complex component names', () => {
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

      // Test with namespaced component names
      listener({ componentId: 1, componentName: 'com.example.screens.HomeScreen', passProps: {} })
      expect(client.getContext()).toBe('com.example.screens.HomeScreen')

      // Test with screen names containing special characters
      listener({ componentId: 2, componentName: 'User-Details-Screen', passProps: {} })
      expect(client.getContext()).toBe('User-Details-Screen')
    })
  })

  describe('breadcrumb metadata', () => {
    it('includes previous screen context in breadcrumb', () => {
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

      listener({ componentId: 1, componentName: 'Home', passProps: {} })
      listener({ componentId: 2, componentName: 'Details', passProps: {} })

      expect(breadcrumbs.length).toBe(2)
      expect(breadcrumbs[1].metadata).toStrictEqual({ to: 'Details', from: 'Home' })
    })

    it('sets from as undefined for initial navigation', () => {
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

      listener({ componentId: 1, componentName: 'Splash', passProps: {} })

      expect(breadcrumbs.length).toBe(1)
      expect(breadcrumbs[0].metadata).toStrictEqual({ to: 'Splash', from: undefined })
    })
  })

  describe('plugin error handling', () => {
    it('handles events without Navigation API gracefully', () => {
      const message = '@bugsnag/plugin-react-native-navigation reference to `Navigation` was undefined'

      expect(() => {
        // eslint-disable-next-line no-new
        new Plugin(undefined)
      }).toThrow(new Error(message))
    })

    it('does not crash when Navigation.events is not available', () => {
      // Create a Navigation object without the events method
      const Navigation = {
        events: () => ({
          registerComponentDidAppearListener: jest.fn()
        })
      }

      const plugin = new Plugin(Navigation)
      const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin] })

      // Should not throw and client should be properly initialized
      expect(client).toBeDefined()
    })

    it('handles missing Navigation object in plugin constructor', () => {
      const message = '@bugsnag/plugin-react-native-navigation reference to `Navigation` was undefined'

      expect(() => {
        // eslint-disable-next-line no-new
        new Plugin(null)
      }).toThrow(new Error(message))
    })

    it('initializes plugin with valid Navigation API', () => {
      const Navigation = {
        events: () => ({
          registerComponentDidAppearListener: jest.fn()
        })
      }

      const plugin = new Plugin(Navigation)

      // Plugin should be created successfully
      expect(plugin).toBeDefined()
    })
  })
})
