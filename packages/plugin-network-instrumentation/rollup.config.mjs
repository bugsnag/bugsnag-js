import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/network-instrumentation.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
