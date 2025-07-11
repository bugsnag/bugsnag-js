type RedactedKey = string | RegExp

interface JsonPayload {
  event: (event: object, redactedKeys?: RedactedKey[]) => string
  session: (session: object, redactedKeys?: RedactedKey[]) => string
}

declare const jsonPayload: JsonPayload

export default jsonPayload