/* eslint-env worker, serviceworker */

import { Client } from '@bugsnag/core'
import EventWithInternals from '@bugsnag/core/event'

const extensionRegex = /^(chrome|moz|safari|safari-web)-extension:/

export default {
  name: 'preventDiscard',
  load: (client: Client) => {
    client.addOnError((event) => {
      (event as EventWithInternals).errors.forEach(({ stacktrace }) => {
        stacktrace.forEach(function (frame) {
          frame.file = frame.file.replace(extensionRegex, '$1_extension:')
        })
      })
    }, true)
  }
}
