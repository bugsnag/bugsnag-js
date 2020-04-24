import { BugsnagStatic, Config, Client } from '@bugsnag/core'

interface ExpoBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts?: string | Config): Client
}
declare const Bugsnag: ExpoBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
