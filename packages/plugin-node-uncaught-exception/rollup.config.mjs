import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/uncaught-exception.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config