import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/contextualize.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config