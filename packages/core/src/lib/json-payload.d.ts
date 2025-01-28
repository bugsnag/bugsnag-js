type RedactedKey = string | RegExp

interface JsonPayload {
  event: (event: Object, redactedKeys?: RedactedKey[]) => string
  session: (session: Object, redactedKeys?: RedactedKey[]) => string
}

declare const jsonPayload: JsonPayload

export default jsonPayload
