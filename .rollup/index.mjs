
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import fs from 'fs'

const defaultOptions = () => ({
  // additional variables to define with '@rollup/plugin-replace'
  // e.g. '{ ABC: 123 }' is equivalent to running 'globalThis.ABC = 123'
  additionalReplacements: {},
  // additional external dependencies, such as '@bugsnag/browser'
  external: [],
  // the entry point for the bundle
  input: undefined,
  // additional rollup plugins
  plugins: []
})

function createRollupConfig (options = defaultOptions()) {
  const packageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`))

  return [
    // ESM build
    {
      input: options.input || './src/index.ts',
      output: {
        dir: 'dist/esm',
        entryFileNames: '[name].mjs',
        format: 'es',
        sourcemap: true,
        generatedCode: {
          preset: 'es2015',
        }
      },
      external: options.external,
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            __BUGSNAG_NOTIFIER_VERSION__: packageJson.version,
            ...options.additionalReplacements,
          }
        }),
        nodeResolve({
          preferBuiltins: true
        }),
        commonjs(),
        typescript({
          tsconfig: './tsconfig.json',
          declarationDir: 'dist/esm',
          outDir: 'dist/esm',
          noEmitOnError: true
        }),
        ...(options.plugins ?? [])
      ]
    },
    // CJS build
    {
      input: options.input || './src/index.ts',
      output: {
        dir: 'dist/cjs',
        entryFileNames: '[name].cjs',
        format: 'cjs',
        sourcemap: true,
        generatedCode: {
          preset: 'es2015',
        },
        exports: 'named',
        interop: 'auto',
        footer: 'module.exports = Object.assign(exports.default || {}, exports);'
      },
      external: options.external,
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            __BUGSNAG_NOTIFIER_VERSION__: packageJson.version,
            ...options.additionalReplacements,
          }
        }),
        nodeResolve({
          preferBuiltins: true
        }),
        commonjs(),
        typescript({
          tsconfig: './tsconfig.json',
          declarationDir: 'dist/cjs',
          outDir: 'dist/cjs',
          noEmitOnError: true
        }),
        {
          name: 'emit-cjs-package-json',
          generateBundle() {
            this.emitFile({
              type: 'asset',
              fileName: 'package.json',
              source: JSON.stringify({ type: 'commonjs' }, null, 2)
            });
          }
        },
        ...(options.plugins ?? [])
      ]
    }
  ]
}

export default createRollupConfig