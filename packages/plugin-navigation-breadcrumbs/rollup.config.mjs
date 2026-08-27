import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/navigation-breadcrumbs.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
