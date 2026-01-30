import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  external: [
    '@bugsnag/cuid', 
    '@bugsnag/safe-json-stringify',
    'error-stack-parser',
    'stack-generator'
  ]
})

export default config