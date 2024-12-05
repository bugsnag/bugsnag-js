import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/inline-script-content.ts',
    external: ['@bugsnag/core/lib/es-utils/map', '@bugsnag/core/lib/es-utils/reduce', '@bugsnag/core/lib/es-utils/filter']
})
