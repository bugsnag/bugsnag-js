import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/request.ts",
  external: [/node_modules/],
});
