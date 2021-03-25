import EventEmitter from 'events'
import NetworkStatus from '../network-status'

describe('delivery: electron -> NetworkStatus', () => {
  it('should assume a connection if net does not respond to `online`', () => {
    const checker = new NetworkStatus({ emitter: new EventEmitter() })
    expect(checker.isConnected).toBe(true)
  })

  it('should use the value of `net.online` when available', () => {
    let checker = new NetworkStatus({ emitter: new EventEmitter() }, { online: true })
    expect(checker.isConnected).toBe(true)

    checker = new NetworkStatus({ emitter: new EventEmitter() }, { online: false })
    expect(checker.isConnected).toBe(false)
  })

  it('alerts watchers when the connection value changes', done => {
    const emitter = new EventEmitter()
    const checker = new NetworkStatus({ emitter })
    const updates: boolean[] = []
    checker.watch((isConnected) => { updates.push(isConnected) })
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)
    setTimeout(() => {
      expect(updates).toEqual([true, false])
      done()
    }, 0)
  })

  it('should not send duplicate updates', done => {
    const emitter = new EventEmitter()
    const checker = new NetworkStatus({ emitter })
    const updates: boolean[] = []
    checker.watch((isConnected) => { updates.push(isConnected) })
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)
    setTimeout(() => {
      expect(updates).toEqual([true, false, true])
      done()
    }, 0)
  })

  it('ignores irrelevant updates', done => {
    const emitter = new EventEmitter()
    const checker = new NetworkStatus({ emitter })
    const updates: boolean[] = []
    checker.watch((isConnected) => { updates.push(isConnected) })
    emitter.emit('MetadataUpdate', { section: 'app', values: { online: false } }, null)
    emitter.emit('MetadataUpdate', { section: 'device', values: { usingBattery: true } }, null)
    setTimeout(() => {
      expect(updates).toEqual([true])
      done()
    }, 0)
  })
})
