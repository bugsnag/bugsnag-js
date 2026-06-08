import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/session.ts',
  external: [
    '@bugsnag/core',
    "backo"
  ]
})

export default config
