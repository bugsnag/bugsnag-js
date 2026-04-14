import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
  input: './src/bugsnag.ts',
  external: [
    '@bugsnag/core',
    '@bugsnag/plugin-node-surrounding-code',
    '@bugsnag/delivery-node',
    '@bugsnag/plugin-app-duration',
    '@bugsnag/plugin-console-breadcrumbs',
    '@bugsnag/plugin-contextualize',
    '@bugsnag/plugin-intercept',
    '@bugsnag/plugin-node-device',
    '@bugsnag/plugin-node-in-project',
    '@bugsnag/plugin-node-surrounding-code',
    '@bugsnag/plugin-node-uncaught-exception',
    '@bugsnag/plugin-node-unhandled-rejection',
    '@bugsnag/plugin-server-session',
    '@bugsnag/plugin-stackframe-path-normaliser',
    '@bugsnag/plugin-strip-project-root',
    'byline',
    'error-stack-parser',
    'pump',
    'stack-generator'
  ]
})
