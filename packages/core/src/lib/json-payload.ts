import jsonStringify from '@bugsnag/safe-json-stringify'

type RedactedKey = string | RegExp

interface JsonPayload {
  event: (event: any, redactedKeys?: RedactedKey[]) => string
  session: (session: object, redactedKeys?: RedactedKey[]) => string
}

const EVENT_REDACTION_PATHS = [
  'events.[].metaData',
  'events.[].breadcrumbs.[].metaData',
  'events.[].request'
]

const jsonPayload: JsonPayload = {
  event: (event: any, redactedKeys?: RedactedKey[]): string => {
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
  },
  session: (session: object, redactedKeys?: RedactedKey[]): string => {
    const payload = jsonStringify(session, null, null)
    return payload
  }
}

export default jsonPayload