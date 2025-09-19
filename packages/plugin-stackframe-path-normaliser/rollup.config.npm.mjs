import createRollupConfig from "../../.rollup/index.mjs"

export default createRollupConfig({
    input: "src/path-normaliser.ts",
    external: [/node_modules/],
})