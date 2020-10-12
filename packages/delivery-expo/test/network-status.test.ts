import NetworkStatus from '../network-status'

import NetInfo from '@react-native-community/netinfo'

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: () => new Promise(resolve => setTimeout(() => resolve({ isConnected: true }), 1))
}))

type Handler = (payload: { isConnected: boolean }) => void

describe('delivery: expo -> NetworkStatus', () => {
  it('should update the value of isConnected when it changes', done => {
    const listeners: Handler[] = []
    NetInfo.addEventListener = ((fn: Handler) => { listeners.push(fn) }) as any

    const ns = new NetworkStatus()
    // initial value before first check should be false
    expect(ns.isConnected).toBe(false)
    expect(listeners.length).toBe(0)
    setTimeout(() => {
      // mocked value for first check is true
      expect(ns.isConnected).toBe(true)
      // then it should start listening
      expect(listeners.length).toBe(1)
      listeners[0]({ isConnected: false })
      // check that the change we sent updated the value
      expect(ns.isConnected).toBe(false)
      done()
    }, 2)
  })

  it('should alert any _watchers when the value of isConnected changes', done => {
    const listeners: Handler[] = []
    NetInfo.addEventListener = ((fn: Handler) => { listeners.push(fn) }) as any

    const ns = new NetworkStatus()
    const changes: boolean[] = []

    ns.watch((isConnected: boolean) => {
      changes.push(isConnected)
      if (changes.length === 4) {
        expect(changes).toEqual([
          false, // initial state is false
          true, // first fetch() result is true
          false, // then we send two updates manually
          true
        ])
        done()
      }
    })

    setTimeout(() => {
      listeners[0]({ isConnected: false })
      setTimeout(() => {
        listeners[0]({ isConnected: true })
      }, 1)
    }, 2)
  })
})
