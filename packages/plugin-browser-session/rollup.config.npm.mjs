import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/session.ts",
  external: ["@bugsnag/core/lib/es-utils/includes"]
});
