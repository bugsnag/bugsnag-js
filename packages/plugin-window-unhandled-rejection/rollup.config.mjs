import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/unhandled-rejection.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
