import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/client-ip.ts",
  external: [/node_modules/],
});
