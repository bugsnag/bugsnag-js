declare class PayloadDeliveryLoop {
  constructor (send: (opts: any, body: any, completion?: (err?: Error) => void) => void,
    queue: any,
    onerror?: (err: Error) => void,
    retryInterval?: number)

  stop (): void
  start (): void
}

export default PayloadDeliveryLoop
