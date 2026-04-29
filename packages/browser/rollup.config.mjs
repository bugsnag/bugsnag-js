import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import fs from 'fs'
import path from 'path'

// Plugin to fix TypeScript declaration files for proper module resolution
function fixDeclarations(options = {}) {
  const { format, declarationExt } = options
  
  return {
    name: 'fix-declarations',
    writeBundle() {
      const typesDir = path.join(process.cwd(), 'dist/types')
      
      if (format === 'esm' && declarationExt === '.d.mts') {
        // Fix ESM declarations: rename to .d.mts and add .js extensions
        const sourceFile = path.join(typesDir, 'index-es.d.ts')
        const targetFile = path.join(typesDir, 'index-es.d.mts')
        
        if (fs.existsSync(sourceFile)) {
          let content = fs.readFileSync(sourceFile, 'utf8')
          // Add .js extensions to relative imports for Node16 ESM resolution
          content = content.replace(/from '(\.\/.+?)';/g, "from '$1.js';")
          fs.writeFileSync(targetFile, content)
          console.log('Created ESM type declaration: dist/types/index-es.d.mts')
        }
      } else if (format === 'cjs' && declarationExt === '.d.cts') {
        // Fix CJS declarations: rename to .d.cts and change export default to export =
        const sourceFile = path.join(typesDir, 'index-cjs.d.ts')
        const targetFile = path.join(typesDir, 'index-cjs.d.cts')
        
        if (fs.existsSync(sourceFile)) {
          let content = fs.readFileSync(sourceFile, 'utf8')
          // Transform 'export default' to 'export ='
          content = content.replace(/export default (_default);/, 'export = $1;')
          fs.writeFileSync(targetFile, content)
          console.log('Created CommonJS type declaration: dist/types/index-cjs.d.cts')
        }
      }
    }
  }
}

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

const sharedOutput = {
  dir: 'dist',
  sourcemap: true,
  generatedCode: {
    preset: 'es2015',
  },
  strict: false, // 'use strict' in WebKit enables Tail Call Optimization, which breaks stack trace handling
}

const treeshake = {
  preset: 'smallest', // More aggressive than 'safest'
  propertyReadSideEffects: false,
  unknownGlobalSideEffects: false,
  // Be more aggressive with module side effects
  moduleSideEffects: false
};

const plugins = [
  nodeResolve({
    browser: true
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
// For ES modules and CJS, we'll keep dependencies bundled for now
// to avoid runtime dependency resolution issues
const external = [
  '@bugsnag/core',
  '@bugsnag/plugin-window-onerror',
  '@bugsnag/plugin-window-unhandled-rejection',
  '@bugsnag/plugin-app-duration',
  '@bugsnag/plugin-browser-device',
  '@bugsnag/plugin-browser-context',
  '@bugsnag/plugin-browser-request',
  '@bugsnag/plugin-simple-throttle',
  '@bugsnag/plugin-console-breadcrumbs',
  '@bugsnag/plugin-network-breadcrumbs',
  '@bugsnag/plugin-navigation-breadcrumbs',
  '@bugsnag/plugin-interaction-breadcrumbs',
  '@bugsnag/plugin-inline-script-content',
  '@bugsnag/plugin-browser-session',
  '@bugsnag/plugin-client-ip',
  '@bugsnag/plugin-strip-query-string',
  '@bugsnag/delivery-xml-http-request'
]

export default [
  {
    input: "src/index-es.ts",
    external, // Keep dependencies bundled for ESM
    output: [
      {
        ...sharedOutput,
        preserveModules: false,
        entryFileNames: '[name].mjs',
        format: 'esm'
      }
    ],
    plugins: [
      ...plugins,
      fixDeclarations({ format: 'esm', declarationExt: '.d.mts' })
    ],
    treeshake
  },
  {
    input: "src/index-cjs.ts",
    external, // Keep dependencies bundled for CJS
    output: [
      {
        ...sharedOutput,
        entryFileNames: '[name].js',
        format: 'cjs',
        exports: 'default',
        interop: 'compat'
      },
    ],
    plugins: [
      ...plugins,
      fixDeclarations({ format: 'cjs', declarationExt: '.d.cts' })
    ],
    treeshake
  },
  {
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
            unsafe_methods: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_undefined: true,
            conditionals: true,
            dead_code: true,
            evaluate: true,
            if_return: true,
            join_vars: true,
            reduce_vars: true,
            unused: true
          },
          mangle: true,
          format: {
            comments: false // Remove all comments
          }
        })]
      }, 
    ],
    plugins,
    treeshake
  }
];
