/* eslint-env worker, serviceworker */

import { schema } from '@bugsnag/core'
import assign from '@bugsnag/core/lib/es-utils/assign'
import getPrefixedConsole from './get-prefixed-console'

export default {
  appType: {
    ...schema.appType,
    defaultValue: () => 'workerjs'
  },
  logger: assign({}, schema.logger, {
    defaultValue: () =>
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  }),
  autoTrackSessions: {
    ...schema.autoTrackSessions,
    defaultValue: () => false
  },
  autoDetectErrors: {
    ...schema.autoTrackSessions,
    defaultValue: () => false
  }
}
