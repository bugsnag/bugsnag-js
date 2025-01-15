import { ErrorHandler } from '@angular/core'
import { Client, Event, Plugin } from '@bugsnag/js'
import BugsnagErrorHandler from './bugsnag-error-handler'

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

const plugin: Plugin = {
  name: 'Angular',
  load: (client: Client): ErrorHandler => {
    const originalNotify = client._notify

    client._notify = function () {
      const event = arguments as unknown as Event
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
  }
}

export default plugin
