import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/index.ts',
    external: ['@bugsnag/in-flight', '@bugsnag/plugin-browser-session']
})
