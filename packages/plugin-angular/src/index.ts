import { ErrorHandler, Injectable } from '@angular/core'
import Bugsnag, { Client, Plugin } from '@bugsnag/js'

// That's the `global.Zone` exposed when the `zone.js` package is used.
declare const Zone: any

// There're 2 types of Angular applications:
// 1) zone-full (by default)
// 2) zone-less
// The developer can avoid importing the `zone.js` package and tells Angular that
// he is responsible for running the change detection by himself. This is done by
// "nooping" the zone through `CompilerOptions` when bootstrapping the root module.
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
        // The `Zone.root.run` basically will run all asynchronous tasks in the most parent zone.
        // The Angular's zone is forked from the `Zone.root`. In this case, `zone.js` won't
        // trigger change detection, and `ApplicationRef.tick()` will not be run.
        // Caretaker note: we're using `Zone.root` as opposed to `NgZone.runOutsideAngular` since this
        // will require injecting the `NgZone` facade. That will create a breaking change for
        // projects already using the `BugsnagErrorHandler`.
        Zone.root.run(() => {
          originalNotify(event)
        })
      } else {
        originalNotify(event)
      }
    }

    return new BugsnagErrorHandler(client)
  },
  name: 'Angular'
}

export default plugin
