/* eslint-env worker, serviceworker */

import { Client } from '@bugsnag/core'

const extensionRegex = /^(chrome|moz|safari|safari-web)-extension:/

export default {
  name: 'preventDiscard',
  load: (client: Client) => {
    client.addOnError((event) => {
      event.errors.forEach(({ stacktrace }) => {
        stacktrace.forEach(function (frame) {
          frame.file = frame.file.replace(extensionRegex, '$1_extension:')
        })
      })
    }, true)
  }
}
