import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: `src/${process.env.ENTRY_NAME}.js`,
  output: {
    file: `dist/${process.env.ENTRY_NAME}.js`,
    format: 'iife',
    legacy: true,
    name: '____'
  },
  plugins: [ resolve({ browser: true }), commonjs() ]
};
