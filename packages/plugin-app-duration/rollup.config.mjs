import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/app-duration.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
