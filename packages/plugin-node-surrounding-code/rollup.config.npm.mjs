import createRollupConfig from "../../.rollup/index.mjs"

export default createRollupConfig({
    input: "src/surrounding-code.ts",
    external: ["fs", "path", "stream", "byline", "pump"],
})
