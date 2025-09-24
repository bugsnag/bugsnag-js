/* eslint-env node */
/* global require, module */
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const babel = require('@rollup/plugin-babel');

module.exports = {
  input: 'src/client-sync.js',
  output: {
    file: 'dist/client-sync.js',
    format: 'cjs'
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    babel({ babelHelpers: 'bundled' })
  ],
  external: ['@bugsnag/core', 'react-native']
}
