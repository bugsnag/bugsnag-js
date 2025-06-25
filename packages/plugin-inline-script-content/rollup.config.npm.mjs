import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/inline-script-content.ts',
    external: [
        '@bugsnag/core',
        '@bugsnag/core/lib/es-utils/reduce'
    ]
})
