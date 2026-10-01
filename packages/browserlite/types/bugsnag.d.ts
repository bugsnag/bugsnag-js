import { Client, Config, BugsnagStatic } from '@bugsnag/core'

interface BrowserLiteConfig extends Config {
  maxEvents?: number
}

export interface BrowserLiteBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | BrowserLiteConfig): Client
  createClient(apiKeyOrOpts: string | BrowserLiteConfig): Client
}

declare const Bugsnag: BrowserLiteBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { BrowserLiteConfig }
