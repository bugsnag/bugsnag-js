import fs from 'fs'
import terser from '@rollup/plugin-terser'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'

// the built files for the CDN go in the top-level 'build' directory so they
// can't accidentally be uploaded to NPM somehow
const buildDirectory = './dist'

if (!fs.existsSync(buildDirectory)) {
  fs.mkdirSync(buildDirectory)
}

const packageJson = JSON.parse(fs.readFileSync('./package.json'))

const sharedOutputOptions = {
  format: 'es',
  name: 'Bugsnag',
  generatedCode: {
    preset: 'es2015',
  },
  sourcemap: true,
}

export default {
  input: 'src/notifier.ts',
  output: [
    {
      ...sharedOutputOptions,
      file: `${buildDirectory}/bugsnag.js`,
    },
    {
      ...sharedOutputOptions,
      file: `${buildDirectory}/bugsnag.min.js`,
      compact: true,
      plugins: [terser({ ecma: 2015 })],
    },
  ],
  plugins: [
    replace({
      preventAssignment: true,
      values: { __VERSION__: packageJson.version },
    }),
    typescript({
      // don't output anything if there's a TS error
      noEmitOnError: true,
    }),
    commonjs(),
    nodeResolve({ browser: true }),
  ],
}
