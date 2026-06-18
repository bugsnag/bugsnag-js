import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: './src/koa.ts',
  external: [
    '@bugsnag/core',
    'koa'
  ]
})

export default config
