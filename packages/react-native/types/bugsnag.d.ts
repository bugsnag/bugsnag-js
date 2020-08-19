import { Client, Config } from '@bugsnag/core'

// these properties are allowed to be configured in the JS layer
type Configurable = 'onError' | 'onBreadcrumb' | 'logger' | 'metadata' | 'user' | 'context' | 'plugins'

type ReactNativeConfig = Pick<Config, Configurable>

interface ReactNativeBugsnagStatic extends Client {
  start(jsOpts?: ReactNativeConfig): Client
}

// the config returned from Configuration.load() includes
// all of the other configuration options, but they are readonly
type NonConfigurable = Exclude<keyof Config, Configurable>
// this utility is in typescript core but was only added in v3.5
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

declare const Bugsnag: ReactNativeBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { ReactNativeConfig }
