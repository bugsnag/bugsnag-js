import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/client-ip.ts",
  external: ["@bugsnag/core/lib/json-payload"]
});
