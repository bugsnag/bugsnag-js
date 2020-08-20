import { Client, Config } from '@bugsnag/core'

// these properties are allowed to be configured in the JS layer
type Configurable = 'onError' | 'onBreadcrumb' | 'logger' | 'metadata' | 'user' | 'context' | 'plugins'

type ReactNativeConfig = Pick<Config, Configurable>

interface ReactNativeBugsnagStatic extends Client {
  start(jsOpts?: ReactNativeConfig): Client
}

declare const Bugsnag: ReactNativeBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { ReactNativeConfig }
