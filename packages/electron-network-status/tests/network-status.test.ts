import Client from '@bugsnag/core/client'
import stateManager from '@bugsnag/plugin-electron-client-state-manager'
import EventEmitter from 'events'
import NetworkStatus from '../network-status'

const appReady = { isReady: () => true, whenReady: async () => new Promise(() => {}) }
const appNotReady = { isReady: () => false, whenReady: async () => new Promise(() => {}) }

const nextTick = async () => new Promise(resolve => process.nextTick(resolve))

const Notifier = {
  name: 'Bugsnag Electron Test',
  version: '0.0.0',
  url: 'https://github.com/bugsnag/bugsnag-js'
}

describe('delivery: electron -> NetworkStatus', () => {
  it('should use the value of `net.online` on construction', () => {
    let checker = new NetworkStatus({ emitter: new EventEmitter() }, { online: true }, appReady)
    expect(checker.isConnected).toBe(true)

    checker = new NetworkStatus({ emitter: new EventEmitter() }, { online: false }, appReady)
    expect(checker.isConnected).toBe(false)
  })

  it('alerts watchers when the connection value changes', async () => {
    const client = new Client({ apiKey: '123' }, {}, [stateManager], Notifier)
    const { emitter, bulkUpdate } = client.getPlugin('clientStateManager')
    const checker = new NetworkStatus({ emitter }, { online: true }, appReady)
    const updates: boolean[] = []

    checker.watch((isConnected) => { updates.push(isConnected) })

    client.addMetadata('device', 'online', false)

    await nextTick()

    expect(updates).toEqual([true, false])

    bulkUpdate({ metadata: { device: { online: true } } })

    await nextTick()

    expect(updates).toEqual([true, false, true])
  })

  it('should not send duplicate updates', async () => {
    const emitter = new EventEmitter()
    const checker = new NetworkStatus({ emitter }, { online: true }, appReady)
    const updates: boolean[] = []

    checker.watch((isConnected) => { updates.push(isConnected) })

    emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } })
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } })
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } })

    await nextTick()

    expect(updates).toEqual([true, false, true])
  })

  it('ignores irrelevant updates', async () => {
    const emitter = new EventEmitter()
    const checker = new NetworkStatus({ emitter }, { online: true }, appReady)
    const updates: boolean[] = []

    checker.watch((isConnected) => { updates.push(isConnected) })

    emitter.emit('MetadataUpdate', { section: 'app', values: { online: false } })
    emitter.emit('MetadataUpdate', { section: 'device', values: { usingBattery: true } })

    await nextTick()

    expect(updates).toEqual([true])
  })

  it('is not online if the app is not ready', () => {
    let checker = new NetworkStatus({ emitter: new EventEmitter() }, { online: true }, appNotReady)
    expect(checker.isConnected).toBe(false)

    checker = new NetworkStatus({ emitter: new EventEmitter() }, { online: false }, appNotReady)
    expect(checker.isConnected).toBe(false)
  })

  it('will not go online after an update until the app is ready', async () => {
    let isReady = false
    let becomeReady = () => {}

    const whenReady = async () => new Promise(resolve => {
      becomeReady = () => {
        isReady = true
        resolve(null)
      }
    })

    const app = { isReady: () => isReady, whenReady }

    const emitter = new EventEmitter()
    const checker = new NetworkStatus({ emitter }, { online: true }, app)

    expect(checker.isConnected).toBe(false)

    const updates: boolean[] = []

    checker.watch((isConnected) => { updates.push(isConnected) })

    // the app is not ready so these updates should not be reported
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)
    emitter.emit('MetadataUpdate', { section: 'device', values: { online: true } }, null)

    await nextTick()

    expect(updates).toEqual([false])
    expect(checker.isConnected).toBe(false)

    becomeReady()

    await nextTick()

    expect(updates).toEqual([false, true])
    expect(checker.isConnected).toBe(true)

    emitter.emit('MetadataUpdate', { section: 'device', values: { online: false } }, null)

    await nextTick()

    expect(updates).toEqual([false, true, false])
    expect(checker.isConnected).toBe(false)
  })
})
