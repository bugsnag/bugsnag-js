import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'

import createRollupConfig from '../../.rollup/index.mjs'

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

const plugins = [
  nodeResolve({
    browser: true
  }),
  commonjs(),
  typescript({
    removeComments: true,
    // don't output anything if there's a TS error
    noEmitOnError: true,
    compilerOptions: {
      target: 'es2015'
    }
  }),
  babel({ babelHelpers: 'bundled' }),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __BUGSNAG_NOTIFIER_VERSION__: packageJson.version,
    }
  })
]

const config = createRollupConfig({
  input: 'src/index.ts'
})

const sharedOutput = {
  dir: 'dist',
  preserveModules: false,
  format: 'umd',
  name: 'Bugsnag'
}

config.push({
    input: 'src/index-umd.ts',
    output: [
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.web-worker.js',
      },
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.web-worker.min.js',
        compact: true,
        plugins: [terser()]
      }
    ],
    plugins
  })

export default config
