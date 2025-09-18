import { makeClientForPlugin } from '@bugsnag/electron-test-helpers'
import { Breadcrumb } from '@bugsnag/core'
import plugin from '../'

describe('plugin: electron renderer event data', () => {
  it('cancels if main process callbacks return false', async () => {
    const { client, sendEvent } = makeClient({ shouldSend: false })

    const onError = jest.fn()
    client.addOnError(onError)

    await sendEvent()
    expect(onError).not.toHaveBeenCalled()
  })

  it('sets context, breadcrumbs, app, device, user, feature flags and metadata from the main process', async () => {
    const context = 'abc context xyz'
    const breadcrumbs = [new Breadcrumb('message', { metadata: true }, 'manual')]
    const app = { abc: 123 }
    const device = { xyz: 456 }
    const user = { id: '10293847' }
    const features = [{ name: 'flag1', variant: 'variant1' }]
    const metadata = { meta: { data: true } }

    const { sendEvent } = makeClient({ context, breadcrumbs, app, device, user, features, metadata })

    const event = await sendEvent()

    expect(event.context).toBe(context)
    expect(event.breadcrumbs).toStrictEqual(breadcrumbs)
    expect(event.app).toStrictEqual({ ...app, releaseStage: 'production', type: undefined, version: undefined, codeBundleId: undefined })
    expect(event.device).toStrictEqual(device)
    expect(event.getUser()).toStrictEqual(user)
    expect(event._features).toStrictEqual(features)
    expect(event.getMetadata('meta')).toStrictEqual(metadata.meta)
  })

  it('prefers pre-existing context from the event', async () => {
    const { client, sendEvent } = makeClient({ context: 'goodbye' })

    client.addOnError(event => { event.context = 'hello' }, true)

    const event = await sendEvent()

    expect(event.context).toBe('hello')
  })

  it('prefers pre-existing user from the event', async () => {
    const { client, sendEvent } = makeClient({ user: { id: 123 } })

    client.addOnError(event => { event.setUser(456, 'abc@example.com', 'abc') }, true)

    const event = await sendEvent()

    expect(event.getUser()).toStrictEqual({ id: 456, email: 'abc@example.com', name: 'abc' })
  })
})

const makeClient = payloadInfo => makeClientForPlugin({ plugins: [plugin(makeIpcRenderer(payloadInfo))] })
const makeIpcRenderer = payloadInfo => ({ getPayloadInfo: async () => payloadInfo })
