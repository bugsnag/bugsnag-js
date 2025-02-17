import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'

import { sharedOutput } from '../../.rollup/index.mjs'

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

const extensions = ['.js', '.ts']

const plugins = [
  nodeResolve({
    preferBuiltins: true,
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
    input: 'src/index-es.ts',
    output: [
      {
        ...sharedOutput,
        preserveModules: false,
        entryFileNames: '[name].mjs',
        format: 'esm'
      }
    ],
    plugins
  },
  {
    input: 'src/index-cjs.ts',
    output: [
      {
        ...sharedOutput,
        entryFileNames: '[name].cjs',
        format: 'cjs'
      }
    ],
    plugins
  }
]
