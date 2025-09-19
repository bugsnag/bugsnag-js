import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/strip-project-root.ts",
  external: ["@bugsnag/path-normalizer"],
});