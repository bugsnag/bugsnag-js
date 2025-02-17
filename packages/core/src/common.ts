import Breadcrumb from "./breadcrumb";
import Client from "./client";
import Session from "./session";
import Event from "./event";

export type BreadcrumbType = 'error' | 'log' | 'manual' | 'navigation' | 'process' | 'request' | 'state' | 'user';

export const BREADCRUMB_TYPES = ['navigation', 'request', 'process', 'log', 'user', 'state', 'error', 'manual'] as const;

export interface Config {
  apiKey: string
  appVersion?: string
  appType?: string
  autoDetectErrors?: boolean
  enabledErrorTypes?: {
    unhandledExceptions?: boolean
    unhandledRejections?: boolean
  }
  autoTrackSessions?: boolean
  context?: string
  enabledBreadcrumbTypes?: BreadcrumbType[] | null
  enabledReleaseStages?: string[] | null
  endpoints?: { notify: string, sessions: string }
  redactedKeys?: Array<string | RegExp>
  onBreadcrumb?: OnBreadcrumbCallback | OnBreadcrumbCallback[]
  onError?: OnErrorCallback | OnErrorCallback[]
  onSession?: OnSessionCallback | OnSessionCallback[]
  logger?: Logger | null
  maxBreadcrumbs?: number
  metadata?: { [section: string]: { [key: string]: any } }
  featureFlags?: FeatureFlag[]
  releaseStage?: string
  plugins?: Plugin[]
  user?: User | null
  reportUnhandledPromiseRejectionsAsHandled?: boolean
  sendPayloadChecksums?: boolean
}

export type OnErrorCallback = (event: Event, cb: (err: null | Error, shouldSend?: boolean) => void) => void | boolean | Promise<void | boolean>
export type OnSessionCallback = (session: Session) => void | boolean;
export type OnBreadcrumbCallback = (breadcrumb: Breadcrumb) => void | boolean;

export interface Plugin<T extends Config = Config> {
  name?: string
  load: (client: Client<T>) => any
  destroy?(): void
  configSchema?: {
    [key: string]: {
      defaultValue: () => unknown
      message: string
      validate: (value: unknown) => boolean
    }
  }
}

export interface Logger {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

export interface EventPayload {
  apiKey: string
  notifier: {
    name: string
    version: string
    url: string
  }
  events: Event[]
}

export interface SessionPayload {
  notifier: {
    name: string
    version: string
    url: string
  }
  device?: Device
  user?: User
  app?: App
  sessions: Session[]
}

export type NotifiableError = Error
| { errorClass: string, errorMessage: string }
| { name: string, message: string }
| string

export interface Device {
  id?: string
  hostname?: string
  locale?: string
  manufacturer?: string
  model?: string
  modelNumber?: string
  orientation?: string
  osName?: string
  osVersion?: string
  runtimeVersions?: {
    [key: string]: any
  }
  time?: Date
  userAgent?: string
  [key: string]: any
}

export interface App {
  codeBundleId?: string
  duration?: number
  durationInForeground?: number
  inForeground?: boolean
  releaseStage?: string
  type?: string
  version?: string
  [key: string]: any
}

export interface Request {
  clientIp?: string
  headers?: { [key: string]: string }
  httpMethod?: string
  referer?: string
  url?: string
  [key: string]: any
}

export interface User {
  id?: string | null | undefined
  email?: string | null | undefined
  name?: string | null | undefined
}

type ThreadType = 'cocoa' | 'android' | 'browserJs'
export interface Thread {
  id: string
  name: string
  errorReportingThread: boolean
  type: ThreadType
  stacktrace: Stackframe[]
  state?: string
}

export interface Stackframe {
  file: string
  method?: string
  lineNumber?: number
  columnNumber?: number
  code?: Record<string, string>
  inProject?: boolean
}

export interface FeatureFlag {
  name: string
  variant?: string | null
}

export interface LoggerConfig {
  debug: (msg: any) => void
  info: (msg: any) => void
  warn: (msg: any) => void
  error: (msg: any, err?: unknown) => void
}

export interface Notifier {
  name: string
  version: string
  url: string
}

export interface EventDeliveryPayload {
  apiKey: string
  notifier: Notifier
  events: Event[]
}

export interface SessionDeliveryPayload {
  notifier?: Notifier
  device?: Device
  app?: App
  sessions?: Array<{
    id: string
    startedAt: Date
    user?: User
  }>
}
export interface Delivery {
  sendEvent(payload: EventDeliveryPayload, cb: (err?: Error | null) => void): void
  sendSession(session: SessionDeliveryPayload, cb: (err?: Error | null) => void): void
}

export interface SessionDelegate<T extends Config = Config> {
  startSession: (client: Client<T>, session: Session) => Client
  pauseSession: (client: Client<T>) => void
  resumeSession: (client: Client<T>) => Client
}

export interface BugsnagStatic extends Client {
  start(apiKeyOrOpts: string | Config): Client
  createClient(apiKeyOrOpts: string | Config): Client
  isStarted(): boolean
}