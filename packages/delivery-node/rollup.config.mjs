import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
    input: "./src/delivery.ts",
    external: [
    '@bugsnag/core',
    '@bugsnag/json-payload'
  ]
})

export default config

