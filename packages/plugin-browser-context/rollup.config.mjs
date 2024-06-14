import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
  external: ['@bugsnag/core']
})
