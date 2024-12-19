import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

import createRollupConfig, { sharedOutput } from "../../.rollup/index.mjs"

export default createRollupConfig({
  input: "src/notifier.ts",
  output: [
    {
      ...sharedOutput,
      entryFileNames: 'bugsnag.js',
      format: 'cjs'
    },
    {
      ...sharedOutput,
      preserveModules: false,
      entryFileNames: 'bugsnag.mjs',
      format: 'esm'
    }, {
      ...sharedOutput,
      entryFileNames: 'bugsnag.min.js',
      format: 'cjs',
      compact: true,
      plugins: [terser({ ecma: 2015 })],
    }
  ],
  plugins: [
    nodeResolve({ browser: true}),
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
  ]
});
