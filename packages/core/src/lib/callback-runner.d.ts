import { NodeCallbackType } from './async-every'

export default function callbackRunner<T>(
  callbacks: any,
  event: T,
  onCallbackError: (err: Error) => void,
  cb: NodeCallbackType<boolean>
): void
