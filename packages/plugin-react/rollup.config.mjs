import babel from '@rollup/plugin-babel'
import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  external: [
    '@bugsnag/core',
    'react'
  ],
  plugins: [
    babel({
      babelHelpers: 'bundled',
      extensions: ['.ts', '.tsx']
    })
  ]
})

export default config