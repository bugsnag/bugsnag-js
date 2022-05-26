import Client from './client'
import { Config } from './common'

export default interface BugsnagStatic extends Client {
  start(apiKeyOrOpts: string | Config): Client
  createClient(apiKeyOrOpts: string | Config): Client
  isStarted(): boolean
}
