import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'

import { sharedOutput } from '../../.rollup/index.mjs'

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

const extensions = ['.js', '.ts']

const plugins = [
  nodeResolve({
    browser: true,
    extensions
  }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    include: ['src/**', 'node_modules/**'],
    extensions,
  }),
  typescript({
    noForceEmit: true,
  }),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __BUGSNAG_NOTIFIER_VERSION__: packageJson.version,
    }
  })
]

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        ...sharedOutput,
        preserveModules: false,
        entryFileNames: '[name].js',
        format: 'esm'
      }
    ],
    plugins
  },
  {
    input: 'src/index-umd.ts',
    output: [
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.web-worker.js',
        format: 'umd',
        name: 'Bugsnag'
      },
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.web-worker.min.js',
        format: 'umd',
        compact: true,
        name: 'Bugsnag',
        plugins: [terser()]
      }
    ],
    plugins
  }
]
