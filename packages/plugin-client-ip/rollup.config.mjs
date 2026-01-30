import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/client-ip.ts',
  external: [
    '@bugsnag/core'
  ]
})

export default config
