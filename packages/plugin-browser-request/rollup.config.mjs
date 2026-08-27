import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/request.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
