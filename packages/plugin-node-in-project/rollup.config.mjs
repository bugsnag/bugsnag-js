import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: 'src/in-project.ts',
  external: [
    "@bugsnag/path-normalizer",
    '@bugsnag/core'
  ]
})

export default config