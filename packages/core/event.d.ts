import { Event } from '.'

interface HandledState {
  unhandled: boolean
  severity: string
  severityReason: { type: string }
}

/**
 * Extend the public type definitions with internal declarations.
 *
 * This is currently used by the unit tests. These will be rolled into the
 * module itself once it is converted to TypeScript.
 */
export default class EventWithInternals extends Event {
  constructor (errorClass: string, errorMessage: string, stacktrace: any[], handledState?: HandledState, originalError?: Error)
  _metadata: { [key: string]: {} }
  _handledState: HandledState
  toJSON(): any;
}
