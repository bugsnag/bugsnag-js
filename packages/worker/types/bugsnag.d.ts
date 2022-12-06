import type { Client, Config, BugsnagStatic } from '@bugsnag/core'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WorkerConfig extends Config {
  // TODO: Add relevant worker related properties
}

interface WorkerBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | WorkerConfig): Client
  createClient(apiKeyOrOpts: string | WorkerConfig): Client
}

declare const Bugsnag: WorkerBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { WorkerConfig }
