import { Client } from '@bugsnag/core'

interface BugsnagInFlight {
  trackInFlight (client: Client): void
  flush (timeoutMs: number): Promise<void>
}

export default BugsnagInFlight
