import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/index.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
