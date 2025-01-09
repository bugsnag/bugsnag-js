import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

import createRollupConfig, { sharedOutput } from "../../.rollup/index.mjs"

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
      target: 'es2015',
    }
  }),
  babel({ babelHelpers: 'bundled' })
]

const external = ['react']

export default [
  createRollupConfig({
    input: "src/index-es.ts",
    output: [
      {
        ...sharedOutput,
        preserveModules: false,
        entryFileNames: '[name].mjs',
        format: 'esm'
      }
    ],
    external,
    plugins
  }),
  createRollupConfig({
    input: "src/index-cjs.ts",
    output: [
      {
        ...sharedOutput,
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
    ],
    external,
    plugins
  }),
  createRollupConfig({
    input: "src/index-umd.ts",
    output: [
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag-react.js',
        format: 'umd',
        name: 'BugsnagReact'
      },
    ],
    external,
    plugins
  })
];
