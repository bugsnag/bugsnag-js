import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'
import Breadcrumb from '@bugsnag/core/breadcrumb'
import plugin from '../'

describe('plugin: electron renderer event data', () => {
  it('cancels if main process callbacks return false', async () => {
    const { client, sendEvent } = makeClient({ shouldSend: false })

    const onError = jest.fn()
    client.addOnError(onError)

    await sendEvent()
    expect(onError).not.toHaveBeenCalled()
  })

  it('sets context, groupingDiscriminator, breadcrumbs, app, device, user, feature flags and metadata from the main process', async () => {
    const context = 'abc context xyz'
    const breadcrumbs = [new Breadcrumb('message', { metadata: true }, 'manual')]
    const app = { abc: 123 }
    const device = { xyz: 456 }
    const user = { id: '10293847' }
    const features = [{ name: 'flag1', variant: 'variant1' }]
    const metadata = { meta: { data: true } }
    const groupingDiscriminator = 'test-discriminator'
    const codeBundleId = 'main-bundle-123'

    const { sendEvent } = makeClient({ context, breadcrumbs, app, device, user, features, metadata, groupingDiscriminator, codeBundleId })

    const event = await sendEvent()

    expect(event.context).toBe(context)
    expect(event.breadcrumbs).toStrictEqual(breadcrumbs)
    expect(event.app).toStrictEqual({ ...app, releaseStage: 'production', type: undefined, version: undefined, codeBundleId: undefined })
    expect(event.device).toStrictEqual(device)
    expect(event.getUser()).toStrictEqual(user)
    expect(event._features).toStrictEqual(features)
    expect(event.getMetadata('meta')).toStrictEqual(metadata.meta)
    expect(event.getGroupingDiscriminator()).toStrictEqual(groupingDiscriminator)
  })

  it('prefers pre-existing context from the event', async () => {
    const { client, sendEvent } = makeClient({ context: 'goodbye' })

    client.addOnError(event => { event.context = 'hello' }, true)

    const event = await sendEvent()

    expect(event.context).toBe('hello')
  })

  it('prefers pre-existing groupingDiscriminator from the event', async () => {
    const { client, sendEvent } = makeClient({ groupingDiscriminator: 'goodbye' })

    client.addOnError(event => { event.setGroupingDiscriminator('hello') }, true)

    const event = await sendEvent()

    expect(event.getGroupingDiscriminator()).toBe('hello')
  })

  it('prefers pre-existing user from the event', async () => {
    const { client, sendEvent } = makeClient({ user: { id: 123 } })

    client.addOnError(event => { event.setUser(456, 'abc@example.com', 'abc') }, true)

    const event = await sendEvent()

    expect(event.getUser()).toStrictEqual({ id: 456, email: 'abc@example.com', name: 'abc' })
  })

  it('does not use main process codeBundleId when renderer has no codeBundleId set', async () => {
    // Simulate main process having a codeBundleId but renderer config having undefined
    const mainProcessPayload = {
      app: {
        releaseStage: 'production',
        version: '1.0.0',
        type: 'electron',
        codeBundleId: 'main-bundle-abc123' // This should NOT be used by renderer
      },
      breadcrumbs: [],
      context: null,
      device: {},
      metadata: {},
      features: [],
      user: {},
      groupingDiscriminator: null
    }

    // Create client with no codeBundleId in renderer config (undefined)
    const { sendEvent } = makeClientForPlugin({
      plugins: [plugin(makeIpcRenderer(mainProcessPayload))],
      config: {
        // Explicitly omit codeBundleId to simulate renderer with no codeBundleId config
      }
    })

    const event = await sendEvent()

    // The renderer should use its own config value (undefined), not the main process value
    expect(event.app.codeBundleId).toBeUndefined()

    // Verify other app properties from main process are still applied
    expect(event.app.releaseStage).toBe('production')
    expect(event.app.version).toBe('1.0.0')
    expect(event.app.type).toBe('electron')
  })
})

const makeClient = (payloadInfo: any) => makeClientForPlugin({ plugins: [plugin(makeIpcRenderer(payloadInfo))] })
const makeIpcRenderer = (payloadInfo: any) => ({ getPayloadInfo: async () => payloadInfo })
