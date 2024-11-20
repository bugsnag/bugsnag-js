import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/delivery.ts",
  external: ['@bugsnag/core/lib/json-payload']
});
