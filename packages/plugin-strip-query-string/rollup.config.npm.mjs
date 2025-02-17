import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/strip-query-string.ts",
  external: [/node_modules/],
});
