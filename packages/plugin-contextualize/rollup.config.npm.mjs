import createRollupConfig from "../../.rollup/index.mjs"

export default createRollupConfig({
    input: "src/contextualize.ts",
    external: ['async_hooks'],
})