import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/context.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
