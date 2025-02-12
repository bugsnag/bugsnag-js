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
  typescript(),
  babel({ babelHelpers: 'bundled' }),
]

const external = [/node_modules/]

export default [
  createRollupConfig({
    input: "src/index.ts",
    external,
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
    input: "src/index.ts",
    external,
    output: [
      {
        ...sharedOutput,
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
    ],
    plugins
  })
];
