type HeadersWithEntries = Headers & {
  entries?: () => Iterator<[string, string]>
}

export default function headersToObject (
  headers: Headers | null | undefined
): Record<string, string> {
  if (!headers) return {}

  const obj: Record<string, string> = {}
  const headersWithEntries = headers as HeadersWithEntries

  if (typeof headersWithEntries.entries === 'function') {
    const iterator = headersWithEntries.entries()
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