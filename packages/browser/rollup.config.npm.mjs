import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'

import { sharedOutput as commonSharedOutput } from "../../.rollup/index.mjs"

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

const sharedOutput = {
  ...commonSharedOutput,
  strict: false, // 'use strict' in WebKit enables Tail Call Optimization, which breaks stack trace handling
}

const extensions = ['.js', '.ts', '.cjs', '.mjs']

const plugins = [
  nodeResolve({
    browser: true,
    extensions
  }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    include: '**', // transpile node_modules as well
    // exclude: [],
    extensions,
    // presets: ['@babel/preset-env', '@babel/preset-typescript'],
    // plugins: [
    //   ['@babel/plugin-transform-arrow-functions'],
    //   ['@babel/plugin-transform-block-scoping'],
    //   ['@babel/plugin-transform-classes', { loose: true }],
    //   ['@babel/plugin-transform-computed-properties', { loose: true }],
    //   ['@babel/plugin-transform-destructuring', { loose: true }],
    //   ['@babel/plugin-transform-member-expression-literals'],
    //   ['@babel/plugin-transform-property-literals'],
    //   ['@babel/plugin-transform-parameters', { loose: true }],
    //   ['@babel/plugin-transform-shorthand-properties'],
    //   ['@babel/plugin-transform-spread', { loose: true }],
    //   ['@babel/plugin-transform-template-literals', { loose: true }],
    //   ['@babel/plugin-proposal-object-rest-spread', { loose: true }],
    //   ['@babel/syntax-object-rest-spread']
    // ]
  }),
  typescript({
    noForceEmit: true,
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
  {
    input: "src/index-es.ts",
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
    input: "src/index-cjs.ts",
    output: [
      {
        ...sharedOutput,
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
    ],
    plugins
  },
  {
    input: "src/index-umd.ts",
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
        plugins: [terser()],
      }, 
    ],
    plugins
  }
];
