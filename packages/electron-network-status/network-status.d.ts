import EventEmitter from 'events'

declare class NetworkStatus {
  constructor (plugin: { emitter: EventEmitter }, net: any, app: any)
  watch (watcher: (state: boolean) => void)

  isConnected: boolean
}

export default NetworkStatus
