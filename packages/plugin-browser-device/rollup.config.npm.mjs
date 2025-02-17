import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/device.ts',
    external: [/node_modules/],
})
