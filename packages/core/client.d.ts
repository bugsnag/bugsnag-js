import { Client, OnErrorCallback, Config, Breadcrumb, Session, OnSessionCallback, OnBreadcrumbCallback, Plugin, Device, App, User } from './types'
import EventWithInternals from './event'

interface LoggerConfig {
  debug: (msg: any) => void
  info: (msg: any) => void
  warn: (msg: any) => void
  error: (msg: any) => void
}

interface Notifier {
  name: string
  version: string
  url: string
}

interface EventDeliveryPayload {
  apiKey: string
  notifier: Notifier
  events: EventWithInternals[]
}

interface SessionDeliveryPayload {
  notifier?: Notifier
  device?: Device
  app?: App
  sessions?: Session[]
}

interface Delivery {
  sendEvent(payload: EventDeliveryPayload, cb: (err?: Error | null) => void): void
  sendSession(session: SessionDeliveryPayload, cb: (err?: Error | null) => void): void
}

/**
 * Extend the public type definitions with internal declarations.
 *
 * This is currently used by the unit tests. These will be rolled into the
 * module itself once it is converted to TypeScript.
 */
export default class ClientWithInternals<T extends Config = Config> extends Client {
  public constructor(opts: T, schema?: {[key: string]: any}, internalPlugins?: Plugin[], notifier?: Notifier)
  _config: T
  _depth: number
  _logger: LoggerConfig
  _breadcrumbs: Breadcrumb[];
  _delivery: Delivery
  _setDelivery: (handler: (client: Client) => Delivery) => void

  _user: User

  _metadata: { [key: string]: any }

  startSession(): ClientWithInternals
  resumeSession(): ClientWithInternals
  _session: Session | null
  _pausedSession: Session | null

  _sessionDelegate: {
    startSession: (client: ClientWithInternals, session: Session) => any
    pauseSession: () => void
    resumeSession: () => void
  }

  _addOnSessionPayload: (cb: (sessionPayload: Session) => void) => void

  _cbs: {
    e: OnErrorCallback[]
    s: OnSessionCallback[]
    sp: any[]
    b: OnBreadcrumbCallback[]
  }
}
