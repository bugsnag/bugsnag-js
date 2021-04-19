import Client, { Delivery } from '@bugsnag/core/client'
import Event from '@bugsnag/core/event'
import plugin from '../'

describe('plugin: electron process info', () => {
  const makeClient = (sendEvent: Delivery['sendEvent'], source: any): Client => {
    const client = new Client({ apiKey: 'api_key' }, undefined, [plugin(source)])
    client._setDelivery(() => ({
      sendEvent: sendEvent,
      sendSession: () => {}
    }))
    return client
  }

  it('attaches the process type', (done) => {
    const processInfo = { type: 'worker' }
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.type).toEqual('worker')
      done()
    }, processInfo)
    client._notify(new Event('Error', 'incorrect lambda type', []))
  })

  it('attaches heap stats', (done) => {
    const processInfo = {
      getHeapStatistics: () => {
        return { malloced: 80, free: 431 }
      }
    }
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.heapStatistics).toEqual({ malloced: 80, free: 431 })
      done()
    }, processInfo)
    client._notify(new Event('Error', 'incorrect lambda type', []))
  })

  it('attaches sandboxed status when unset', (done) => {
    const processInfo = {}
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.sandboxed).toBe(false)
      done()
    }, processInfo)
    client._notify(new Event('Error', 'incorrect lambda type', []))
  })

  it('attaches sandboxed status when set', (done) => {
    const processInfo = { sandboxed: true }
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.sandboxed).toBe(true)
      done()
    }, processInfo)
    client._notify(new Event('Error', 'incorrect lambda type', []))
  })

  it('attaches main frame status when unset', (done) => {
    const processInfo = {}
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.isMainFrame).toBe(false)
      done()
    }, processInfo)
    client._notify(new Event('Error', 'incorrect lambda type', []))
  })

  it('attaches main frame status when set', (done) => {
    const processInfo = { isMainFrame: true }
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.isMainFrame).toBe(true)
      done()
    }, processInfo)
    client._notify(new Event('Error', 'incorrect lambda type', []))
  })
})
