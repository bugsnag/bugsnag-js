import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  external: [
    '@bugsnag/core',
    'react'
  ]
})

export default config