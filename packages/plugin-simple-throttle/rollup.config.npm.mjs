import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/throttle.ts',
    external: ['@bugsnag/core/lib/validators/int-range']
})
