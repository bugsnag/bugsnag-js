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

const treeshake = {
  preset: 'smallest', // More aggressive than 'safest'
  propertyReadSideEffects: false,
  unknownGlobalSideEffects: false,
  // Be more aggressive with module side effects
  moduleSideEffects: false,
  // Enable more aggressive tree shaking for annotations
  annotations: true
};

const plugins = [
  nodeResolve({
    browser: true,
    preferBuiltins: false,
    // Enable tree-shaking for better dead code elimination
    exportConditions: ['import'],
    // More aggressive tree shaking
    modulesOnly: true, // Only resolve ES modules for better tree shaking
  }),
  commonjs({
    // Improve tree-shaking for CommonJS modules
    ignoreTryCatch: 'remove'
  }),
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
  })
]

// External dependencies to reduce bundle size
const external = [
  // Keep heavy dependencies external for certain builds
  // 'error-stack-parser', 
  // 'stack-generator',
  // '@bugsnag/safe-json-stringify',
  // '@bugsnag/cuid'
]

export default [
  createRollupConfig({
    input: "src/index-es.ts",
    external, // Add external dependencies
    output: [
      {
        ...sharedOutput,
        preserveModules: false,
        entryFileNames: '[name].mjs',
        format: 'esm'
      }
    ],
    plugins,
    treeshake
  }),
  createRollupConfig({
    input: "src/index-cjs.ts",
    external, // Add external dependencies
    output: [
      {
        ...sharedOutput,
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
    ],
    plugins,
    treeshake
  }),
  createRollupConfig({
    input: "src/index-umd.ts",
    // UMD needs all dependencies bundled for standalone use
    external: [], // Keep dependencies bundled for UMD
    output: [
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.js',
        format: 'umd',
        name: 'Bugsnag'
      },
      {
        ...sharedOutput,
        entryFileNames: 'bugsnag.min.js',
        format: 'umd',
        compact: true,
        name: 'Bugsnag',
        plugins: [terser({
          compress: {
            passes: 3, // Increase from 2
            drop_console: true, // Remove console statements
            drop_debugger: true, // Remove debugger statements
            pure_getters: true,
            unsafe_math: true,
            // unsafe_methods: true,
            // unsafe_proto: true,
            // unsafe_regexp: true,
            // unsafe_undefined: true,
            conditionals: true,
            dead_code: true,
            evaluate: true,
            if_return: true,
            join_vars: true,
            reduce_vars: true,
            unused: true
          },
          // mangle: {
          //   properties: {
          //     regex: /^_/ // Mangle private properties starting with _
          //   }
          // },
          format: {
            comments: false // Remove all comments
          }
        })]
      }, 
    ],
    plugins,
    treeshake
  })
];
