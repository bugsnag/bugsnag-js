import { Event, Session } from '@bugsnag/core'

type RedactedKey = string | RegExp

declare const JsonPayload: {
  event: (event: Event, redactedKeys: RedactedKey[]) => string
  session: (session: Session, redactedKeys: RedactedKey[]) => string
}

export default JsonPayload
