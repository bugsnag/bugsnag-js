
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import fs from 'fs'
import path from 'path'

// Plugin to add .js extensions to imports in .d.ts files for ESM compatibility
function fixEsmTypeImports() {
  return {
    name: 'fix-esm-type-imports',
    writeBundle(options) {
      const outDir = options.dir
      if (!outDir || !outDir.includes('esm')) return

      const fixImportsInFile = (filePath) => {
        let content = fs.readFileSync(filePath, 'utf8')
        
        // Replace relative imports in 'from' statements: from './file' or from "./file"
        content = content.replace(
          /from\s+(['"])(\.\.[\/\\].*?|\.\/.*?)\1/g,
          (match, quote, importPath) => {
            // Don't add extension if it already has one
            if (/\.[a-z]+$/.test(importPath)) {
              return match
            }
            return `from ${quote}${importPath}.js${quote}`
          }
        )
        
        // Replace relative imports in inline import() statements: import("./file")
        content = content.replace(
          /import\((['"])(\.\.[\/\\].*?|\.\/.*?)\1\)/g,
          (match, quote, importPath) => {
            // Don't add extension if it already has one
            if (/\.[a-z]+$/.test(importPath)) {
              return match
            }
            return `import(${quote}${importPath}.js${quote})`
          }
        )
        
        fs.writeFileSync(filePath, content, 'utf8')
      }

      const processDirectory = (dirPath) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name)
          if (entry.isDirectory()) {
            processDirectory(fullPath)
          } else if (entry.name.endsWith('.d.ts')) {
            fixImportsInFile(fullPath)
          }
        }
      }

      processDirectory(outDir)
    }
  }
}

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
        entryFileNames: '[name].js',
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
        fixEsmTypeImports(),
        ...(options.plugins ?? [])
      ]
    },
    // CJS build
    {
      input: options.input || './src/index.ts',
      output: {
        dir: 'dist/cjs',
        entryFileNames: '[name].js',
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