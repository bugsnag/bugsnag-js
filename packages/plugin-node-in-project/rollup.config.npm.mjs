import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/in-project.ts",
  external: ["@bugsnag/path-normalizer"],
});