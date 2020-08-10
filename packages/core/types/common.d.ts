import Client from './client'
import Event from './event'
import Session from './session'
import Breadcrumb from './breadcrumb'

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
  metadata?: { [key: string]: any }
  releaseStage?: string
  plugins?: Plugin[]
  user?: User | null
}

export type OnErrorCallback = (event: Event, cb?: (err: null | Error) => void) => void | Promise<void> | boolean;
export type OnSessionCallback = (session: Session) => void | boolean;
export type OnBreadcrumbCallback = (breadcrumb: Breadcrumb) => void | boolean;

export interface Plugin {
  name?: string
  load: (client: Client) => any
  destroy?(): void
}

export interface Logger {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

export interface SessionDelegate {
  startSession: (client: Client) => Client
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

export type BreadcrumbType = 'error' | 'log' | 'manual' | 'navigation' | 'process' | 'request' | 'state' | 'user';

interface Device {
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

interface App {
  codeBundleId?: string
  duration?: number
  durationInForeground?: number
  inForeground?: boolean
  releaseStage?: string
  type?: string
  version?: string
  [key: string]: any
}

interface Request {
  clientIp?: string
  headers?: { [key: string]: string }
  httpMethod?: string
  referer?: string
  url?: string
  [key: string]: any
}

export interface User {
  id?: string
  email?: string
  name?: string
}

type ThreadType = 'cocoa' | 'android' | 'browserJs'
export interface Thread {
  id: string
  name: string
  errorReportingThread: boolean
  type: ThreadType
  stacktrace: Stackframe[]
}

export interface Stackframe {
  file: string
  method?: string
  lineNumber?: number
  columnNumber?: number
  code?: Record<string, string>
  inProject?: boolean
}
