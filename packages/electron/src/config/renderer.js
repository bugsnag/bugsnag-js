const { schema } = require('./common')
const { stringWithLength } = require('@bugsnag/core')

const ALLOWED_IN_RENDERER = [
  // a list of config keys that are allowed to be supplied to the renderer client
  // this must be kept in sync with the typescript "AllowedRendererConfig" type
  'onError', 'onBreadcrumb', 'logger', 'metadata', 'featureFlags', 'user', 'context', 'codeBundleId', 'plugins', 'appType'
]

module.exports.schema = {
  ...schema,
  projectRoot: {
    defaultValue: () => null,
    validate: value => value === null || stringWithLength(value),
    message: 'should be string'
  },
  releaseStage: {
    ...schema.releaseStage,
    defaultValue: () => null
  },
  logger: Object.assign({}, schema.logger, {
    defaultValue: () => getPrefixedConsole()
  }),
  codeBundleId: {
    defaultValue: () => undefined,
    message: 'should be a string',
    validate: val => (val === undefined || stringWithLength(val))
  }
}

module.exports.mergeOptions = (additionalSchemaKeys, mainOpts, rendererOpts) => {
  return Object.keys(module.exports.schema).concat(additionalSchemaKeys).reduce((accum, k) => {
    if (Object.prototype.hasOwnProperty.call(rendererOpts, k)) {
      if (ALLOWED_IN_RENDERER.includes(k)) {
        if (k === 'metadata') {
          // ensure that metadata set in renderer config doesn't blow away all preexisting metadata
          return { ...accum, [k]: mergeMetadata(mainOpts[k], rendererOpts[k]) }
        } else {
          return { ...accum, [k]: rendererOpts[k] }
        }
      }
      console.warn(`[bugsnag] Cannot set "${k}" configuration option in renderer. This must be set in the main process.`)
    }
    return { ...accum, [k]: mainOpts[k] }
  }, {})
}

const getPrefixedConsole = () => {
  return ['debug', 'info', 'warn', 'error'].reduce((accum, method) => {
    const consoleMethod = console[method] || console.log
    accum[method] = consoleMethod.bind(console, '[bugsnag]')
    return accum
  }, {})
}

const mergeMetadata = (a, b) => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (!bKeys.length) return a
  const sections = new Set([...aKeys, ...bKeys])
  const merged = {}
  sections.forEach(section => {
    merged[section] = {}
    Object.assign(merged[section], a[section], b[section])
  })
  return merged
}
