import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/intercept.ts",
  external: [/node_modules/],
});