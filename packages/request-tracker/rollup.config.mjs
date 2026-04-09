import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  external: [
    '@bugsnag/core'
  ]
})

export default config
