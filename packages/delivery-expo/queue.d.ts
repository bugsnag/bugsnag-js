declare class UndeliveredPayloadQueue {
  constructor(resource: string, onerror?: (err: Error) => void)

  static generateFilename(resource: string): string

  init(): Promise<void>
  peek(): { payload: { url: string}, id: string } | null
  enqueue(req?: {}): Promise<void>
  update(id: string, updates: { retries: number }): Promise<void>
}

export default UndeliveredPayloadQueue
