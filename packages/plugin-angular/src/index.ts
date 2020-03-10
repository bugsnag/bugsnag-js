import { ErrorHandler, Injectable } from '@angular/core'
import Bugsnag, { Client, Plugin } from '@bugsnag/js'

@Injectable()
export class BugsnagErrorHandler extends ErrorHandler {
  public bugsnagClient: Client;
  constructor (client?: Client) {
    super()
    if (client) {
      this.bugsnagClient = client
    } else {
      this.bugsnagClient = ((Bugsnag as any)._client as Client)
    }
  }

  public handleError (error: any): void {
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

    if (error.ngDebugContext) {
      event.addMetadata('angular', {
        component: error.ngDebugContext.component,
        context: error.ngDebugContext.context
      })
    }

    this.bugsnagClient._notify(event)
    ErrorHandler.prototype.handleError.call(this, error)
  }
}

const plugin: Plugin = {
  load: (client: Client): ErrorHandler => {
    return new BugsnagErrorHandler(client)
  },
  name: 'Angular'
}

export default plugin
