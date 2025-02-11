import Breadcrumb from './breadcrumb'
import {
  NotifiableError,
  BreadcrumbType,
  OnErrorCallback,
  OnSessionCallback,
  OnBreadcrumbCallback,
  User,
  FeatureFlag,
  Config,
  Plugin,
  Device,
  App,
} from './common'
import Event from './event'
import Session from './session'

interface LoggerConfig {
  debug: (msg: any) => void
  info: (msg: any) => void
  warn: (msg: any) => void
  error: (msg: any, err?: unknown) => void
}

interface Notifier {
  name: string
  version: string
  url: string
}

interface EventDeliveryPayload {
  apiKey: string
  notifier: Notifier
  events: Event[]
}

interface SessionDeliveryPayload {
  notifier?: Notifier
  device?: Device
  app?: App
  sessions?: Array<{
    id: string
    startedAt: Date
    user?: User
  }>
}

interface Delivery {
  sendEvent(payload: EventDeliveryPayload, cb: (err?: Error | null) => void): void
  sendSession(session: SessionDeliveryPayload, cb: (err?: Error | null) => void): void
}

interface SessionDelegate {
  startSession: (client: Client, session: Session) => Client
  pauseSession: (client: Client) => void
  resumeSession: (client: Client) => Client
}

declare class Client<T extends Config = Config> {
  // "private" interfaces
  public constructor(opts: T, schema?: {[key: string]: any}, internalPlugins?: Plugin[], notifier?: Notifier)
  _config: T
  _depth: number
  _logger: LoggerConfig
  _breadcrumbs: Breadcrumb[]
  _delivery: Delivery
  _setDelivery: (handler: (client: Client) => Delivery) => void
  _clientContext: any
  _user: User

  _metadata: { [key: string]: any }
  _features: Array<FeatureFlag | null>
  _featuresIndex: { [key: string]: number }

  startSession(): Client
  resumeSession(): Client
  _session: Session | null
  _pausedSession: Session | null

  _sessionDelegate: SessionDelegate

  _addOnSessionPayload: (cb: (sessionPayload: Session) => void) => void

  _cbs: {
    e: OnErrorCallback[]
    s: OnSessionCallback[]
    sp: any[]
    b: OnBreadcrumbCallback[]
  }

  _loadPlugin(plugin: Plugin): void

  _isBreadcrumbTypeEnabled(type: string): boolean

  // access to internal classes
  public Breadcrumb: typeof Breadcrumb;
  public Event: typeof Event;
  public Session: typeof Session;

    // reporting errors
  public notify(
    error: NotifiableError,
    onError?: OnErrorCallback,
    postReportCallback?: (err: any, event: Event) => void
  ): void;

  public _notify(
    event: Event,
    onError?: OnErrorCallback,
    postReportCallback?: (err: any, event: Event) => void,
  ): void;

  // breadcrumbs
  public leaveBreadcrumb(
    message: string,
    metadata?: { [key: string]: any },
    type?: BreadcrumbType
  ): void;

  // metadata
  public addMetadata(section: string, values: { [key: string]: any }): void;
  public addMetadata(section: string, key: string, value: any): void;
  public getMetadata(section: string, key?: string): any;
  public clearMetadata(section: string, key?: string): void;

  // feature flags
  public addFeatureFlag(name: string, variant?: string | null): void
  public addFeatureFlags(featureFlags: FeatureFlag[]): void
  public clearFeatureFlag(name: string): void
  public clearFeatureFlags(): void

  // context
  public getContext(): string | undefined;
  public setContext(c: string): void;

  // user
  public getUser(): User;
  public setUser(id?: string | null, email?: string | null, name?: string | null): void;

  // sessions
  public startSession(): Client;
  public pauseSession(): void;
  public resumeSession(): Client;

  // callbacks
  public addOnError(fn: OnErrorCallback, moveToFront?: boolean): void;
  public removeOnError(fn: OnErrorCallback): void;

  public addOnSession(fn: OnSessionCallback): void;
  public removeOnSession(fn: OnSessionCallback): void;

  public addOnBreadcrumb(fn: OnBreadcrumbCallback): void;
  public removeOnBreadcrumb(fn: OnBreadcrumbCallback): void;

  // plugins
  public getPlugin(name: string): any;

  // implemented on the browser notifier only
  public resetEventCount?(): void;
}

export default Client
