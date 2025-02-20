import plugin from '../hermes'

import { Client, EventPayload } from '@bugsnag/core'

describe('plugin: react native hermes', () => {
  it('should add an onError callback which captures device information', () => {
    const client = new Client({ apiKey: 'API_KEY_YEAH', plugins: [plugin()] })
    const payloads: EventPayload[] = []

    expect(client._cbs.e.length).toBe(1)

    client._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

    const err = new Error('hermes')
    // mock a hermes stacktrace
    err.stack = `Error: crashhhh
  at anonymous (address at index.android.bundle:1:480076)
  at v (address at index.android.bundle:1:14616)
  at d (address at index.android.bundle:1:14309)
  at o (address at index.android.bundle:1:13935)
  at anonymous (address at index.android.bundle:1:21026)
  at v (address at index.android.bundle:1:14616)
  at d (address at index.android.bundle:1:14266)
  at o (address at index.android.bundle:1:13935)
  at global (address at index.android.bundle:1:13667)`

    client.notify(err)

    expect(payloads.length).toEqual(1)
    expect(payloads[0].events[0].errors[0].stacktrace[0].file).toBe('index.android.bundle')
    expect(payloads[0].events[0].errors[0].stacktrace[1].file).toBe('index.android.bundle')
    expect(payloads[0].events[0].errors[0].stacktrace[2].file).toBe('index.android.bundle')
    expect(payloads[0].events[0].errors[0].stacktrace[3].file).toBe('index.android.bundle')
  })
})
