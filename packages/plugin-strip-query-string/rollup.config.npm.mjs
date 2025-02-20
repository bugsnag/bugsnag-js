import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/strip-query-string.ts",
  external: ['@bugsnag/core', "@bugsnag/core/lib/es-utils/map", "@bugsnag/core/lib/es-utils/reduce"]
});
