import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'

import createRollupConfig, { sharedOutput } from "../../.rollup/index.mjs"

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

export default createRollupConfig({
  input: "src/bugsnag.ts",
  output: [
    {
      ...sharedOutput,
      preserveModules: false,
      entryFileNames: '[name].mjs',
      format: 'esm'
    },
    {
      ...sharedOutput,
      entryFileNames: '[name].cjs',
      format: 'cjs',
    },
    {
      ...sharedOutput,
      entryFileNames: '[name].js',
      format: 'umd',
      name: 'Bugsnag'
    },
    , {
      ...sharedOutput,
      entryFileNames: '[name].min.js',
      format: 'umd',
      compact: true,
      name: 'Bugsnag',
      plugins: [terser({ ecma: 2015 })],
    }, 
  ],
  plugins: [
    nodeResolve({
      browser: true
    }),
    commonjs(),
    typescript({
      removeComments: true,
      // don't output anything if there's a TS error
      noEmitOnError: true,
      // turn on declaration files and declaration maps
      compilerOptions: {
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        declarationDir: 'dist/types',
      }
    }),
    babel({ babelHelpers: 'bundled' }),
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        values: { __VERSION__: packageJson.version },
      },
    }),
  ]
});
