import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/inline-script-content.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
