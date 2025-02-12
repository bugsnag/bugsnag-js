import { schema } from '@bugsnag/core/config'
import { Event } from '@bugsnag/core'
import stringWithLength from '@bugsnag/core/lib/validators/string-with-length'
import os from 'os'
import { inspect } from 'util'

import assign from '@bugsnag/core/lib/es-utils/assign'
import getPrefixedConsole from './get-prefixed-console'
import { LoggerConfig } from '@bugsnag/core/client'

const config = {
  appType: {
    ...schema.appType,
    defaultValue: () => 'node'
  },
  projectRoot: {
    defaultValue: () => process.cwd(),
    validate: (value: unknown) => value === null || stringWithLength(value),
    message: 'should be string'
  },
  hostname: {
    defaultValue: () => os.hostname(),
    message: 'should be a string',
    validate: (value: unknown) => value === null || stringWithLength(value)
  },
  logger: assign({}, schema.logger, {
    defaultValue: () =>
      // set logger based on browser capability
      (typeof console !== 'undefined' && typeof console.debug === 'function')
        ? getPrefixedConsole()
        : undefined
  }),
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => process.env.NODE_ENV || 'production'
  },
  agent: {
    defaultValue: () => undefined,
    message: 'should be an HTTP(s) agent',
    validate: (value: unknown) => value === undefined || isAgent(value)
  },
  onUncaughtException: {
    defaultValue: () => (err: Error, event: Event, logger: LoggerConfig) => {
      logger.error(`Uncaught exception${getContext(event)}, the process will now terminate…\n${printError(err)}`)
      process.exit(1)
    },
    message: 'should be a function',
    validate: (value: unknown) => typeof value === 'function'
  },
  onUnhandledRejection: {
    defaultValue: () => (err: Error, event: Event, logger: LoggerConfig) => {
      logger.error(`Unhandled rejection${getContext(event)}…\n${printError(err)}`)
    },
    message: 'should be a function',
    validate: (value: unknown) => typeof value === 'function'
  }
}

const printError = (err: Error) => err && err.stack ? err.stack : inspect(err)

const getContext = (event: Event) =>
  event.request && Object.keys(event.request).length
    ? ` at ${event.request.httpMethod} ${event.request.path || event.request.url}`
    : ''

const isAgent = (value: any) => (typeof value === 'object' && value !== null) || typeof value === 'boolean'

export default config
