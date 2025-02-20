import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/navigation-breadcrumbs.ts',
    external: ['@bugsnag/core']
})
