import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/context.ts",
  external: [/node_modules/]
});
