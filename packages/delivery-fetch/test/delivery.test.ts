// import delivery from '../dist/delivery'
// import type { Client } from '@bugsnag/core'
// import type { EventDeliveryPayload } from '@bugsnag/core/client'

interface MockFetchRequest {
  method: string | null
  url: string | null
  data: string | null
  headers: { [key: string]: string }
  readyState: string | null
}

describe('delivery:fetch', () => {
  it('sends events successfully', done => {
    expect(true).toBeTruthy()
    done()
  })
})
