import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/strip-project-root.ts',
  external: [
    '@bugsnag/core',
    '@bugsnag/path-normalizer'
  ]
})

export default config