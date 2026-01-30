import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/strip-query-string.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
