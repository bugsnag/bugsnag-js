import createRollupConfig from "../../.rollup/index.mjs"

export default createRollupConfig({
    input: "src/uncaught-exception.ts",
    external: ['async_hooks'],
})