import createRollupConfig from "../../.rollup/index.mjs"

export default createRollupConfig({
    input: "src/restify.ts",
    external: ["restify", "async_hooks", "net"],
})