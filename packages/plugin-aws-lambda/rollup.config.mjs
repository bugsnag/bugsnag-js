import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  external: [
    '@bugsnag/core', 
    '@bugsnag/in-flight',
    '@bugsnag/plugin-browser-session'
  ]
})

export default config