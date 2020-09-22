import Plugin from '../react-native-navigation'
import Client from '@bugsnag/core/client'

describe('plugin-react-native-navigation', () => {
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
    interface Event {
      componentId: number
      componentName: string
      passProps: object
    }

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
})
