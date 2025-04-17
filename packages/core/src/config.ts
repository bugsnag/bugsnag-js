import filter from './lib/es-utils/filter'
import reduce from './lib/es-utils/reduce'
import keys from './lib/es-utils/keys'
import isArray from './lib/es-utils/is-array'
import includes from './lib/es-utils/includes'
import intRange from './lib/validators/int-range'
import stringWithLength from './lib/validators/string-with-length'
import listOfFunctions from './lib/validators/list-of-functions'

import { BREADCRUMB_TYPES } from './common'

const defaultErrorTypes = () => ({ unhandledExceptions: true, unhandledRejections: true })

export interface Schema {
  apiKey: {
    defaultValue: () => null
    message: string
    validate: (value: unknown) => boolean
  }
  appVersion: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  appType: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  autoDetectErrors: {
    defaultValue: () => true
    message: string
    validate: (value: unknown) => boolean
  }
  enabledErrorTypes: {
    defaultValue: () => { unhandledExceptions: boolean, unhandledRejections: boolean }
    message: string
    allowPartialObject: boolean
    validate: (value: unknown) => boolean
  }
  onError: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  onSession: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  onBreadcrumb: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  endpoints: {
    defaultValue: (endpoints: { notify: string, sessions: string } | undefined) => { notify: string | null, sessions: string | null }
    message: string
    validate: (value: unknown) => boolean
  }
  autoTrackSessions: {
    defaultValue: () => boolean
    message: string
    validate: (value: unknown) => boolean
  }
  enabledReleaseStages: {
    defaultValue: () => null
    message: string
    validate: (value: unknown) => boolean
  }
  releaseStage: {
    defaultValue: () => 'production'
    message: string
    validate: (value: unknown) => boolean
  }
  maxBreadcrumbs: {
    defaultValue: () => 25
    message: string
    validate: (value: unknown) => boolean
  }
  enabledBreadcrumbTypes: {
    defaultValue: () => typeof BREADCRUMB_TYPES
    message: string
    validate: (value: unknown) => boolean
  }
  context: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  user: {
    defaultValue: () => {}
    message: string
    validate: (value: unknown) => boolean
  }
  metadata: {
    defaultValue: () => {}
    message: string
    validate: (value: unknown) => boolean
  }
  logger: {
    defaultValue: () => undefined
    message: string
    validate: (value: unknown) => boolean
  }
  redactedKeys: {
    defaultValue: () => ['password']
    message: string
    validate: (value: unknown) => boolean
  }
  plugins: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  featureFlags: {
    defaultValue: () => []
    message: string
    validate: (value: unknown) => boolean
  }
  reportUnhandledPromiseRejectionsAsHandled: {
    defaultValue: () => false
    message: string
    validate: (value: unknown) => boolean
  },
  sendPayloadChecksums: {
    defaultValue: () => false,
    message: string,
    validate: (value: unknown) => boolean
  }
}

const schema: Schema = {
  apiKey: {
    defaultValue: () => null,
    message: 'is required',
    validate: stringWithLength
  },
  appVersion: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: (value: unknown) => value === undefined || stringWithLength(value)
  },
  appType: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: (value: unknown) => value === undefined || stringWithLength(value)
  },
  autoDetectErrors: {
    defaultValue: () => true,
    message: 'should be true|false',
    validate: (value: unknown) => value === true || value === false
  },
  enabledErrorTypes: {
    defaultValue: () => defaultErrorTypes(),
    message: 'should be an object containing the flags { unhandledExceptions:true|false, unhandledRejections:true|false }',
    allowPartialObject: true,
    validate: (value: unknown) => {
      // ensure we have an object
      if (typeof value !== 'object' || !value) return false
      const providedKeys = keys(value)
      const defaultKeys = keys(defaultErrorTypes())
      // ensure it only has a subset of the allowed keys
      if (filter(providedKeys, k => includes(defaultKeys, k)).length < providedKeys.length) return false
      // ensure all of the values are boolean
      if (filter(keys(value), k => typeof value[k] !== 'boolean').length > 0) return false
      return true
    }
  },
  onError: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: listOfFunctions
  },
  onSession: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: listOfFunctions
  },
  onBreadcrumb: {
    defaultValue: () => [],
    message: 'should be a function or array of functions',
    validate: listOfFunctions
  },
  endpoints: {
    defaultValue: (endpoints?: unknown) => {
      // only apply the default value if no endpoints have been provided, otherwise prevent delivery by setting to null
      if (typeof endpoints === 'undefined') {
        return ({
          notify: 'https://notify.bugsnag.com',
          sessions: 'https://sessions.bugsnag.com'
        })
      } else {
        return ({ notify: null, sessions: null })
      }
    },
    message: 'should be an object containing endpoint URLs { notify, sessions }',
    validate: (val: unknown) =>
      // first, ensure it's an object
      !!(val && typeof val === 'object') &&
      (
        // notify and sessions must always be set
        'notify' in val && stringWithLength(val.notify) && 'sessions' in val && stringWithLength(val.sessions)
      ) &&
      // ensure no keys other than notify/session are set on endpoints object
      filter(keys(val), k => !includes(['notify', 'sessions'], k)).length === 0
  },
  autoTrackSessions: {
    defaultValue: ()  => true,
    message: 'should be true|false',
    validate: (val: unknown) => val === true || val === false
  },
  enabledReleaseStages: {
    defaultValue: () => null,
    message: 'should be an array of strings',
    validate: (value: unknown) => value === null || (isArray(value) && filter(value, f => typeof f === 'string').length === value.length)
  },
  releaseStage: {
    defaultValue: () => 'production',
    message: 'should be a string',
    validate: (value: unknown) => typeof value === 'string' && !!value.length
  },
  maxBreadcrumbs: {
    defaultValue: () => 25,
    message: 'should be a number ≤100',
    validate: (value: unknown) => intRange(0, 100)(value)
  },
  enabledBreadcrumbTypes: {
    defaultValue: () => BREADCRUMB_TYPES,
    message: `should be null or a list of available breadcrumb types (${BREADCRUMB_TYPES.join(',')})`,
    validate: (value: unknown) => value === null || (isArray(value) && reduce(value, (accum, maybeType) => {
      if (accum === false) return accum
      // TS doesn't like passing a readonly to a function that might mutate an array
      return includes(BREADCRUMB_TYPES as unknown as any[], maybeType)
    }, true))
  },
  context: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: (value: unknown) => value === undefined || typeof value === 'string'
  },
  user: {
    defaultValue: () => ({}),
    message: 'should be an object with { id, email, name } properties',
    validate: (value: unknown) =>
      (value === null) ||
      (value && reduce(
        keys(value),
        (accum, key) => accum && includes(['id', 'email', 'name'], key),
        true
      ))
  },
  metadata: {
    defaultValue: () => ({}),
    message: 'should be an object',
    validate: (value: unknown) => typeof value === 'object' && value !== null
  },
  logger: {
    defaultValue: () => undefined,
    message: 'should be null or an object with methods { debug, info, warn, error }',
    validate: (value: unknown) =>
      (!value) ||
      (value && reduce(
        ['debug', 'info', 'warn', 'error'],
        // @ts-expect-error - TS doesn't know that value is an object
        (accum, method) => accum && typeof value[method] === 'function',
        true
      ))
  },
  redactedKeys: {
    defaultValue: () => ['password'],
    message: 'should be an array of strings|regexes',
    validate: (value: unknown) =>
      isArray(value) && value.length === filter(value, s =>
        (typeof s === 'string' || (s && typeof s.test === 'function'))
      ).length
  },
  plugins: {
    defaultValue: () => ([]),
    message: 'should be an array of plugin objects',
    validate: (value: unknown) =>
      isArray(value) && value.length === filter(value, p =>
        (p && typeof p === 'object' && typeof p.load === 'function')
      ).length
  },
  featureFlags: {
    defaultValue: () => [],
    message: 'should be an array of objects that have a "name" property',
    validate: (value: unknown) =>
      isArray(value) && value.length === filter(value, feature =>
        feature && typeof feature === 'object' && typeof feature.name === 'string'
      ).length
  },
  reportUnhandledPromiseRejectionsAsHandled: {
    defaultValue: () => false,
    message: 'should be true|false',
    validate: (value: unknown) => value === true || value === false
  },
  sendPayloadChecksums: {
    defaultValue: () => false,
    message: 'should be true|false',
    validate: (value: unknown) => value === true || value === false
  }
}

export default schema