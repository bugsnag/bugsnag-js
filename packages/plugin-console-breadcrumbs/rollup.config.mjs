import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/console-breadcrumbs.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
