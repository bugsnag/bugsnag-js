import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/network-breadcrumbs.ts",
  external: ['@bugsnag/core', "@bugsnag/core/lib/es-utils/includes"]
});