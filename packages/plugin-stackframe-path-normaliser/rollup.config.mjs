import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/path-normaliser.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
