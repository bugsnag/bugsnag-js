import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  external: [
    '@bugsnag/core', 
    '@bugsnag/safe-json-stringify'
  ]
})

export default config