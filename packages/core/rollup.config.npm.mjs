import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

import { sharedOutput } from "../../.rollup/index.mjs"

const extensions = ['.js', '.ts']

const plugins = [
  nodeResolve({
    extensions
  }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    extensions,
  }),
  typescript({
    noForceEmit: true,
  }),
]

const external = [/node_modules/]

export default [
  {
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
  },
  {
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
  },
  // json-payload separate export
  {
    input: "src/lib/json-payload.ts",
    external,
    output: [
      {
        ...sharedOutput,
        entryFileNames: 'lib/json-payload.mjs',
        format: 'esm',
        preserveModules: false
      }
    ],
    plugins
  },
  {
    input: "src/lib/json-payload.ts",
    external,
    output: [
      {
        ...sharedOutput,
        entryFileNames: 'lib/json-payload.cjs',
        format: 'cjs',
        preserveModules: false
      },
    ],
    plugins
  }
];
