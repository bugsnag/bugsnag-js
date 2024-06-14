import { ErrorHandler, Injectable } from '@angular/core'
import Bugsnag, { Client, Plugin } from '@bugsnag/js'

// This actually should be `ZoneType`, but we can't type it since the `zone.js`
// package may not be installed.
declare const Zone: any;

// There're 2 types of Angular applications:
// 1) zone-full (by default)
// 2) zone-less
// The developer can avoid importing the `zone.js` package and tells Angular that
// they are responsible for running the change detection by themselves. This is done by
// "nooping" the zone through `CompilerOptions` when bootstrapping the root module (`{ ngZone: 'noop' }`).
const isNgZoneEnabled = typeof Zone !== 'undefined' && !!Zone.root && typeof Zone.root.run === 'function'

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

    if (isNgZoneEnabled) {
      // The `Zone.root.run` will spawn asynchronous tasks within the root zone, a parent for the Angular forked zone.
      // That means that `zone.js` won't notify the forked zone about invoking tasks; thus, change detection will not
      // be triggered multiple times through `ApplicationRef.tick()`.
      // Caretaker note: we could've used `NgZone.runOutsideAngular`, but this will require injecting the `NgZone`
      // facade. That will create a breaking change for projects already using the `BugsnagErrorHandler`.
      Zone.root.run(() => {
        this.bugsnagClient._notify(event)
      })
    } else {
      this.bugsnagClient._notify(event)
    }

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
