import typescript from '@rollup/plugin-typescript'
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
})

function createRollupConfig (options = defaultOptions()) {
  const packageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`))

  return {
    input: options.input || 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      preserveModules: true,
      generatedCode: {
        preset: 'es2015',
      },
    },
    external: ['@bugsnag/core'].concat(options.external),
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          __VERSION__: packageJson.version,
          ...options.additionalReplacements,
        },
      }),
      typescript({
        // don't output anything if there's a TS error
        noEmitOnError: true,
        // turn on declaration files and declaration maps
        compilerOptions: {
          declaration: true,
          declarationMap: true,
          emitDeclarationOnly: true,
          declarationDir: 'dist/types',
        },
      }),
    ],
  }
}

export default createRollupConfig
