export interface Schema {
  apiKey: {
    defaultValue: () => null
    message: string
    validate: (value: unknown) => boolean
  }
  appVersion: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  appType: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  autoDetectErrors: {
    defaultValue: () => true
    message: string
    validate: (value: unknown) => boolean
  }
  enabledErrorTypes: {
    defaultValue: () => { unhandledExceptions: boolean, unhandledRejections: boolean }
    message: string
    allowPartialObject: boolean
    validate: (value: unknown) => boolean
  }
  onError: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  onSession: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  onBreadcrumb: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  endpoints: {
    defaultValue: (endpoints: { notify: string, sessions: string } | undefined) => { notify: string | null, sessions: string | null }
    message: string
    validate: (value: unknown) => boolean
  }
  autoTrackSessions: {
    defaultValue: () => boolean
    message: string
    validate: (value: unknown) => boolean
  }
  enabledReleaseStages: {
    defaultValue: () => null
    message: string
    validate: (value: unknown) => boolean
  }
  releaseStage: {
    defaultValue: () => 'production'
    message: string
    validate: (value: unknown) => boolean
  }
  maxBreadcrumbs: {
    defaultValue: () => 25
    message: string
    validate: (value: unknown) => boolean
  }
  enabledBreadcrumbTypes: {
    defaultValue: () => ['navigation', 'request', 'process', 'log', 'user', 'state', 'error', 'manual']
    message: string
    validate: (value: unknown) => boolean
  }
  context: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  user: {
    defaultValue: () => {}
    message: string
    validate: (value: unknown) => boolean
  }
  metadata: {
    defaultValue: () => {}
    message: string
    validate: (value: unknown) => boolean
  }
  logger: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  redactedKeys: {
    defaultValue: () => ['password']
    message: string
    validate: (value: unknown) => boolean
  }
  plugins: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  featureFlags: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  reportUnhandledPromiseRejectionsAsHandled: {
    defaultValue: () => false
    message: string
    validate: (value: unknown) => boolean
  }
}

export const schema: Schema
