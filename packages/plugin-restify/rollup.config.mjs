import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/restify.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
