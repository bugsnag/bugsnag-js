import { Client, BrowserConfig, BugsnagStatic } from '@bugsnag/browser'
import { NodeConfig } from '@bugsnag/node'

interface UniversalBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | BrowserConfig | NodeConfig): Client
  createClient(apiKeyOrOpts: string | BrowserConfig | NodeConfig): Client
}

declare const Bugsnag: UniversalBugsnagStatic

export default Bugsnag
export * from '@bugsnag/browser'
