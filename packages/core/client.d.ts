import { Client, OnErrorCallback, Config, Breadcrumb, Session, OnSessionCallback, OnBreadcrumbCallback } from './types'

interface LoggerConfig {
  debug: (msg: any) => void
  info: (msg: any) => void
  warn: (msg: any) => void
  error: (msg: any) => void
}

/**
 * Extend the public type definitions with internal declarations.
 *
 * This is currently used by the unit tests. These will be rolled into the
 * module itself once it is converted to TypeScript.
 */
export default class ClientWithInternals extends Client {
  public constructor(opts: Config)
  _config: { [key: string]: {} }
  _logger: LoggerConfig
  _breadcrumbs: Breadcrumb[];
  _setDelivery: (handler: (client: Client) => {
    sendEvent: (payload: any, cb: (err?: Error | null) => void) => void
  }) => void

  _metadata: { [key: string]: any }
  _session: Session
  _sessionDelegate: {
    startSession: (client: ClientWithInternals) => any
  }

  _cbs: {
    e: OnErrorCallback[]
    s: OnSessionCallback[]
    sp: any[]
    b: OnBreadcrumbCallback[]
  }
}
