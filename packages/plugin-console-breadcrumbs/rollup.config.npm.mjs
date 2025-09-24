import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/console-breadcrumbs.ts",
  external: [/node_modules/],
});
