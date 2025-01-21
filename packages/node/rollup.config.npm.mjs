import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'

import createRollupConfig, { sharedOutput } from '../../.rollup/index.mjs'

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
      values: { __VERSION__: packageJson.version }
    }
  })
]

export default [
  createRollupConfig({
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
  }),
  createRollupConfig({
    input: 'src/index-cjs.ts',
    output: [
      {
        ...sharedOutput,
        entryFileNames: '[name].cjs',
        format: 'cjs'
      }
    ],
    plugins
  })
]
