import { FirstPlugin, LastPlugin } from '../internal-callback-marker'
import { Plugin, Client } from '@bugsnag/core'

describe('@bugsnag/plugin-internal-callback-marker', () => {
  it('should annotate callbacks added by internal plugins with _internal:true', () => {
    interface OnErrorCallback {
      (): void
      _internal?: boolean
    }

    const internalOnError: OnErrorCallback = () => {}
    const externalOnErrorViaConfig: OnErrorCallback = () => {}
    const externalOnErrorViaMethod: OnErrorCallback = () => {}
    const externalOnErrorViaPlugin: OnErrorCallback = () => {}

    const internalPlugins: Plugin[] = [
      {
        load: (client: Client) => {
          client.addOnError(internalOnError)
        }
      }
    ]

    const externalPlugins: Plugin[] = [
      {
        load: (client: Client) => {
          client.addOnError(externalOnErrorViaPlugin)
        }
      }
    ]

    const client = new Client({
      apiKey: '123',
      onError: externalOnErrorViaConfig,
      plugins: externalPlugins
    }, undefined, [FirstPlugin, ...internalPlugins, LastPlugin])

    client.addOnError(externalOnErrorViaMethod)
    expect(client._cbs.e.length).toBe(4)

    expect(internalOnError._internal).toBe(true)
    expect(externalOnErrorViaConfig._internal).toBeUndefined()
    expect(externalOnErrorViaMethod._internal).toBeUndefined()
    expect(externalOnErrorViaPlugin._internal).toBeUndefined()
  })
})
