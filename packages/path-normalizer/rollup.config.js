/* eslint-env node */
/* global require, module */
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')

module.exports = [
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'default'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      })
    ],
    external: ['path']
  },
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        declaration: false,
        tsconfig: './tsconfig.json'
      })
    ],
    external: ['path']
  }
]
