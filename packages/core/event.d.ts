import { App, Device, Event, Request, Breadcrumb, User, Session } from './types'
import { Error } from './types/event'

interface HandledState {
  unhandled: boolean
  severity: string
  severityReason: { type: string }
}

interface FeatureFlagPayload {
  featureFlag: string
  variant?: string
}

/**
 * Extend the public type definitions with internal declarations.
 *
 * This is currently used by the unit tests. These will be rolled into the
 * module itself once it is converted to TypeScript.
 */
export default class EventWithInternals extends Event {
  constructor (errorClass: string, errorMessage: string, stacktrace: any[], handledState?: HandledState, originalError?: Error)
  _metadata: { [key: string]: any }
  _features: { [key: string]: string | null }
  _user: User
  _handledState: HandledState
  _session?: Session
  toJSON(): {
    payloadVersion: '4'
    exceptions: Array<Error & { message: Error['errorMessage'] }>
    severity: Event['severity']
    unhandled: boolean
    severityReason: {
      type: string
      [key: string]: any
    }
    app: App
    device: Device
    request: Request
    breadcrumbs: Breadcrumb[]
    context: string | undefined
    groupingHash: string | undefined
    metaData: { [key: string]: any }
    user: User
    session: Session
    featureFlags: FeatureFlagPayload[]
  };
}
