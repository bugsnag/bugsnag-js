import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/request.ts",
  external: ['@bugsnag/core/lib/es-utils/assign']
});