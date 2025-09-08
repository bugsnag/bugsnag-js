import createRollupConfig from "../../.rollup/index.mjs"

export default createRollupConfig({
    input: "src/delivery.ts",
    external: ['http', 'https', 'url'],
})