import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/express.ts',
  external: [
    '@bugsnag/core',
    'express'
  ]
})

export default config
