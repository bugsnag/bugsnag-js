import type { EventDeliveryPayload, SessionDeliveryPayload } from "@bugsnag/core";
import jsonStringify from '@bugsnag/safe-json-stringify';

type RedactedKey = string | RegExp

const EVENT_REDACTION_PATHS = [
  'events.[].metaData',
  'events.[].breadcrumbs.[].metaData',
  'events.[].request'
]

export const event = (event: EventDeliveryPayload, redactedKeys?: RedactedKey[]) => {
  let payload = jsonStringify(event, null, null, { redactedPaths: EVENT_REDACTION_PATHS, redactedKeys })
  if (payload.length > 10e5) {
    event.events[0]._metadata = {
      notifier:
`WARNING!
Serialized payload was ${payload.length / 10e5}MB (limit = 1MB)
metadata was removed`
    }
    payload = jsonStringify(event, null, null, { redactedPaths: EVENT_REDACTION_PATHS, redactedKeys })
  }
  return payload
}

export const session = (session: SessionDeliveryPayload, redactedKeys?: RedactedKey[]) => {
  const payload = jsonStringify(session, null, null)
  return payload
}

