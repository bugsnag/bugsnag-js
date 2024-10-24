import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/unhandled-rejection.ts',
    external: ['@bugsnag/core/lib/iserror', '@bugsnag/core/lib/es-utils/map']
})
