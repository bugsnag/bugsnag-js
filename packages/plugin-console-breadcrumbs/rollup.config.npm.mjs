import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/console-breadcrumbs.ts",
  external: ['@bugsnag/core', "@bugsnag/core/lib/es-utils/filter", "@bugsnag/core/lib/es-utils/reduce"]
});
