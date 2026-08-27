import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/interaction-breadcrumbs.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
