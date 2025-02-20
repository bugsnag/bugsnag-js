import Breadcrumb from './breadcrumb'
import {
  App,
  Device,
  Request,
  Logger,
  User,
  Thread,
  Stackframe,
  FeatureFlag
} from './common'
import Session from './session'

interface FeatureFlagPayload {
  featureFlag: string
  variant?: string
}
declare class Event {
  public static create(
    maybeError: any,
    tolerateNonErrors: boolean,
    handledState: HandledState,
    component: string,
    errorFramesToSkip: number,
    logger?: Logger
  ): Event

  public app: App
  public device: Device
  public request: Request

  public errors: Error[];
  public breadcrumbs: Breadcrumb[]
  public threads: Thread[]

  public severity: 'info' | 'warning' | 'error'

  public readonly originalError: any
  public unhandled: boolean

  public apiKey?: string
  public context?: string
  public groupingHash?: string

  // user
  public getUser(): User
  public setUser(id?: string, email?: string, name?: string): void

  // metadata
  public addMetadata(section: string, values: { [key: string]: any }): void
  public addMetadata(section: string, key: string, value: any): void
  public getMetadata(section: string, key?: string): any
  public clearMetadata(section: string, key?: string): void

  // feature flags
  public getFeatureFlags(): FeatureFlag[]
  public addFeatureFlag(name: string, variant?: string | null): void
  public addFeatureFlags(featureFlags: FeatureFlag[]): void
  public clearFeatureFlag(name: string): void
  public clearFeatureFlags(): void

  // trace correlation
  public setTraceCorrelation(traceId: string, spanId?: string): void

  // "private" api
  _metadata: { [key: string]: any }
  constructor (errorClass: string, errorMessage: string, stacktrace: any[], handledState?: HandledState, originalError?: Error)
  _features: FeatureFlag | null[]
  _featuresIndex: { [key: string]: number }
  _user: User
  _handledState: HandledState
  _correlation?: { spanId: string, traceId: string }
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
    correlation: { spanId: string, traceId: string } | undefined
    groupingHash: string | undefined
    metaData: { [key: string]: any }
    user: User
    session: Session
    featureFlags: FeatureFlagPayload[]
  };
}

interface HandledState {
  severity: string
  unhandled: boolean
  severityReason: {
    type: string
    [key: string]: any
  }
}

export interface Error {
  errorClass: string
  errorMessage: string
  stacktrace: Stackframe[]
  type: string
}

export default Event
