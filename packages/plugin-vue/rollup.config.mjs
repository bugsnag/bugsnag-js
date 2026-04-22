import babel from '@rollup/plugin-babel'
import createRollupConfig from "../../.rollup/index.mjs"

const config = createRollupConfig({
  input: 'src/index.ts',
  plugins: [
      babel({
        babelHelpers: 'bundled',
        extensions: ['.ts']
      })
    ]
})

export default config
