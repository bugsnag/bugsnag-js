import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/device.ts',
  external: [
    '@bugsnag/core',
    '@bugsnag/cuid'
  ]
})

export default config
