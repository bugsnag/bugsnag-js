import { ErrorHandler, Injectable } from '@angular/core'
import Bugsnag, { Client, Plugin } from '@bugsnag/js'

// angular uses zones to watch for changes in asynchronous tasks so it can
// update the UI in response
// Bugsnag uses a lot of asynchronous tasks when notifying, which trigger change
// detection multiple times. This causes a potential performance problem, so we
// need to run `notify` outside of the current zone if zones are being used
// see https://angular.io/guide/zone
declare const Zone: any

// zones are optional, so we need to detect if they are being used
// see https://angular.io/guide/zone#noopzone
const isNgZoneEnabled = typeof Zone !== 'undefined' && !!Zone.current

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
    const originalNotify = client._notify

    client._notify = function (event) {
      if (isNgZoneEnabled) {
        // run notify in the root zone to avoid triggering change detection
        Zone.root.run(() => {
          originalNotify(event)
        })
      } else {
        // if zones are not enabled, change detection will not run anyway
        originalNotify(event)
      }
    }

    return new BugsnagErrorHandler(client)
  },
  name: 'Angular'
}

export default plugin
