type NodeCallbackType<T = any> = (error?: Error | null, result?: T) => void;

export default function every<T>(
  arr: T[],
  fn: (item: T, cb: NodeCallbackType) => void,
  cb: NodeCallbackType<boolean>
): void
