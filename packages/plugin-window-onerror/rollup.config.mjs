import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: 'src/onerror.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
