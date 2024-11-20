import { Event, Session } from '@bugsnag/core'

type RedactedKey = string | RegExp

interface JsonPayload {
  event: (event: Event, redactedKeys: RedactedKey[]) => string
  session: (session: Session, redactedKeys: RedactedKey[]) => string
}

declare const jsonPayload: JsonPayload

export default jsonPayload
