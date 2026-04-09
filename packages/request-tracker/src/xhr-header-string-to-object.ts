export default function xhrHeaderStringToObject (headersString: string): Record<string, string> {
  if (!headersString) return {}
  const arr = headersString.trim().split(/[\r\n]+/)
  const headerMap: Record<string, string> = {}
  arr.forEach((line) => {
    const parts = line.split(': ')
    const header = parts.shift() as string
    const value = parts.join(': ')
    headerMap[header] = value
  })
  return headerMap
}
