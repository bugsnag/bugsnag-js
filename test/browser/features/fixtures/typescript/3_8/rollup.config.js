import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import typescript from '@rollup/plugin-typescript'

export default {
  input: `src/main.ts`,
  output: {
    file: `dist/bundle.js`,
    format: 'iife',
    name: 'BugsnagTS38Test',
    globals: {
      '@bugsnag/browser': 'Bugsnag'
    }
  },
  external: ['@bugsnag/browser'],
  plugins: [ 
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: false,
      inlineSources: false,
      module: 'es2015',
      compilerOptions: {
        types: []
      }
    }),
    resolve({ 
      browser: true,
      preferBuiltins: false,
      mainFields: ['browser', 'module', 'main']
    }), 
    commonjs({
      include: ['node_modules/**'],
      exclude: ['src/**']
    })
  ]
};
