import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/throttle.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
