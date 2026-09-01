export default function headersToObject (headers: Headers): Record<string, string> {
  if (!headers) return {}

  const obj: Record<string, string> = {}

  const entries = (headers as Headers & {
    entries?: () => IterableIterator<string[]>
  }).entries

  if (typeof entries === 'function') {
    const iterator = entries.call(headers)

    let entry = iterator.next()

    while (!entry.done) {
      const [key, value] = entry.value
      obj[key] = value
      entry = iterator.next()
    }
  } else if (typeof headers.forEach === 'function') {
    headers.forEach((value: string, key: string) => {
      obj[key] = value
    })
  }

  return obj
}
