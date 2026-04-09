interface XhrLike {
  response: unknown
  responseType: XMLHttpRequestResponseType
}

export default function xhrResponseParser ({ response, responseType }: XhrLike): string | undefined {
  if (response === null || response === undefined) {
    return undefined
  }

  switch (responseType) {
    case 'arraybuffer':
    case 'blob':
      return '[Binary Data]'
    case 'document':
      return '[Document]'
    case 'json':
      try {
        return JSON.stringify(response)
      } catch (e) {
        return '[Unserializable JSON]'
      }
    case 'text':
    case '':
    default:
      return String(response)
  }
}
