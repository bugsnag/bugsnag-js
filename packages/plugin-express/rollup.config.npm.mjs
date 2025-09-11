import createRollupConfig from "../../.rollup/index.mjs"

export default createRollupConfig({
    input: "src/express.ts",
    external: ["express", "net", "async_hooks"],
})