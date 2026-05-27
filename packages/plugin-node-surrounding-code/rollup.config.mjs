import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/surrounding-code.ts',
  external: [
    '@bugsnag/core',
    'byline',
    'pump'
  ]
})

export default config
