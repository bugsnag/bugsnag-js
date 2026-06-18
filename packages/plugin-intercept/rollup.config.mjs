import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/intercept.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
