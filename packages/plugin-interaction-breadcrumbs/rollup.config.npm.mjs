import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/interaction-breadcrumbs.ts',
    external: [/node_modules/]
})
