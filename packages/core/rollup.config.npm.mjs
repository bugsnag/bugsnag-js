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
  typescript(),
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
  }
];
