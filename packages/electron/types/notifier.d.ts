import {
  Client,
  Config,
  Event,
  Logger,
  OnErrorCallback
} from '@bugsnag/core'

type AfterErrorCallback = (err: any, event: Event, logger: Logger) => void
type OnSendErrorCallback = OnErrorCallback

interface MainConfig extends Config {
  enabledErrorTypes?: {
    unhandledExceptions?: boolean
    unhandledRejections?: boolean
    nativeCrashes?: boolean
  }
  endpoints?: {
    notify: string
    sessions: string
    minidumps: string
  }
  idleThreshold?: number
  onSendError?: OnSendErrorCallback | OnSendErrorCallback[]
  onUncaughtException?: AfterErrorCallback
  onUnhandledRejection?: AfterErrorCallback
  projectRoot?: string
}

// a renderer is only allowed a subset of properties from Config
type AllowedRendererConfig = Pick<Config, 'context'|'logger'|'metadata'|'onError'|'onBreadcrumb'|'plugins'|'user'>

interface RendererConfig extends AllowedRendererConfig {
  codeBundleId?: string
}

interface ElectronBugsnagStatic extends Client {
  start: (apiKeyOrOpts?: string | MainConfig | RendererConfig) => Client
  createClient: (apiKeyOrOpts?: string | MainConfig | RendererConfig) => Client
}

declare const Bugsnag: ElectronBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { MainConfig, RendererConfig }
