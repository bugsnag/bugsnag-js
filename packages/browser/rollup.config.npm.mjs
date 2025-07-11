import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'

import createRollupConfig, { sharedOutput as commonSharedOutput } from "../../.rollup/index.mjs"

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

const sharedOutput = {
  ...commonSharedOutput,
  strict: false, // 'use strict' in WebKit enables Tail Call Optimization, which breaks stack trace handling
}

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
      target: 'es2015', // Output ES2015 for babel to process
    }
  }),
  babel({ 
    babelHelpers: 'bundled',
    // Use the local babel configuration that targets Chrome 43
    configFile: './babel.config.js',
    // Process ALL files, including dependencies
    exclude: [],
    // Include all extensions that might contain code
    extensions: ['.js', '.ts', '.mjs', '.cjs'],
    // Ensure babel processes the entire bundle, including node_modules
    include: ['**/*']
  }),
  replace({
    preventAssignment: true,
    values: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __BUGSNAG_NOTIFIER_VERSION__: packageJson.version,
    },
  }),
]

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
    external: ['@bugsnag/json-payload'],
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
    external: ['@bugsnag/json-payload'],
    plugins
  }),
  createRollupConfig({
    input: "src/index-umd.ts",
    output: [
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.js',
        format: 'umd',
        globals: {
          '@bugsnag/json-payload': 'BugsnagJsonPayload'
        },
        name: 'Bugsnag'
      },
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.min.js',
        format: 'umd',
        compact: true,
        name: 'Bugsnag',
        globals: {
          '@bugsnag/json-payload': 'BugsnagJsonPayload'
        },
        plugins: [terser()],
      }, 
    ],
    external: ['@bugsnag/json-payload'],
    plugins
  })
];
