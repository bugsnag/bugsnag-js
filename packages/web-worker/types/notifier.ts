import type { Client, Config, BugsnagStatic } from '@bugsnag/core'

interface WorkerConfig extends Config {
  collectUserIp?: boolean
  generateAnonymousId?: boolean
}

interface WorkerBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | WorkerConfig): Client
  createClient(apiKeyOrOpts: string | WorkerConfig): Client
}

declare const Bugsnag: WorkerBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { WorkerConfig }
