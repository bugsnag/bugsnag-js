import { ErrorHandler } from '@angular/core'
import Bugsnag, { Client } from '@bugsnag/js'

type BugsnagWithInternals = typeof Bugsnag & {
  _client: Client
}

class BugsnagErrorHandler implements ErrorHandler {
  public bugsnagClient: Client;

  constructor (client?: Client) {
    if (client) {
      this.bugsnagClient = client
    } else {
      this.bugsnagClient = (Bugsnag as BugsnagWithInternals)._client
    }
  }

  handleError (error: any): void {
    const handledState = {
      severity: 'error',
      severityReason: { type: 'unhandledException' },
      unhandled: true
    }

    const event = this.bugsnagClient.Event.create(
      error,
      true,
      handledState,
      'angular error handler',
      1
    )

    this.bugsnagClient._notify(event)

    // Default Angular error handling
    // ErrorHandler.prototype.handleError.call(this, error)
    console.error(error)
  }
}

export default BugsnagErrorHandler
