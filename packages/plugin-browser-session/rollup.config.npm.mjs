import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/session.ts",
  external: [/node_modules/],
});
