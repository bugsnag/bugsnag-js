import { ErrorHandler, VERSION } from '@angular/core'
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

    // Add angular runtime to device metadata
    const device = { runtimeVersions: { angular: VERSION.full } }
    this.bugsnagClient.addOnSession(session => {
      session.device = { ...session.device, ...device }
    })
    this.bugsnagClient.addOnError((event) => {
      event.device = { ...event.device, ...device }
    })
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

    // Replicate the default behaviour of the angular error handler by calling console.error
    // previously this called ErrorHandler.prototype.handleError but this caused a mismatch between
    // the compiled code and the angular version used in the application.
    console.error(error)
  }
}

export default BugsnagErrorHandler
