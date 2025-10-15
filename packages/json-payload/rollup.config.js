/* eslint-env node */
/* global require, module */
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')
const terser = require('@rollup/plugin-terser')
const replace = require('@rollup/plugin-replace')

module.exports = [
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true
      }),
      nodeResolve({
        preferBuiltins: true,
        browser: false
      }),
      commonjs(),
      typescript({
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      }),
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true,
          pure_funcs: ['console.log'],
          passes: 2
        },
        mangle: {
          reserved: ['event', 'session']
        },
        format: {
          comments: false
        }
      })
    ],
    external: ['path']
  },
  // ES Module build (optimized for browsers)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es'
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true
      }),
      nodeResolve({
        preferBuiltins: false,
        browser: true
      }),
      commonjs(),
      typescript({
        declaration: false,
        target: 'ES2018' // Modern target for smaller output
      }),
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true,
          pure_funcs: ['console.log'],
          passes: 2,
          module: true
        },
        mangle: {
          reserved: ['event', 'session'],
          module: true
        },
        format: {
          comments: false
        }
      })
    ],
    external: ['path']
  }
]
