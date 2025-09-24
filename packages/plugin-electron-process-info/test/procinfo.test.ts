import { Client, Event, Delivery } from '@bugsnag/core'
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

  it('does not overwrite process type if already set to preload', (done) => {
    const processInfo = { type: 'worker' }
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.type).toEqual('preload')
      done()
    }, processInfo)
    const event = new Event('Error', 'incorrect lambda type', [])
    event.addMetadata('process', 'type', 'preload')
    client._notify(event)
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

  it('does not attach sandboxed status when unset', (done) => {
    const processInfo = {}
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.sandboxed).toBe(undefined)
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

  it('does not attach main frame status when unset', (done) => {
    const processInfo = {}
    const client = makeClient((payload: any) => {
      const metadata = payload.events[0]._metadata
      expect(metadata.process.isMainFrame).toBe(undefined)
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
