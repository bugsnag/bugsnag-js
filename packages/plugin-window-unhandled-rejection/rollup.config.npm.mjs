import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/unhandled-rejection.ts',
    external: [/node_modules/]
})
