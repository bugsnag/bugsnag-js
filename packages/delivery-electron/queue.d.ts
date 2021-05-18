declare class PayloadQueue {
  constructor (path: string, resource: string, onerror?: (err: Error) => void)

  peek (): Promise<{ payload: { url: string}, path: string } | null>
  init (): Promise<void>
  enqueue (req?: {}): Promise<void>
  remove (path: string): Promise<void>
}

export default PayloadQueue
