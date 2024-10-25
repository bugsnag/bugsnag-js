import { Client, Config } from '@bugsnag/core'

interface ReactNativeSchema extends Config {
  codeBundleId?: string
}

// these properties are allowed to be configured in the JS layer
type Configurable = 'onError' | 'onBreadcrumb' | 'logger' | 'metadata' | 'user' | 'context' | 'plugins' | 'codeBundleId' | 'featureFlags' | 'reportUnhandledPromiseRejectionsAsHandled'

type ReactNativeConfig = Pick<ReactNativeSchema, Configurable>

interface ReactNativeBugsnagStatic extends Client {
  start(jsOpts?: ReactNativeConfig): Client
  isStarted(): boolean
}

declare const Bugsnag: ReactNativeBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { ReactNativeConfig }
