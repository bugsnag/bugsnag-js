import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
  input: 'src/notifier.ts',
  output: [
    {
      dir: `dist`,
      entryFileNames: '[name].js',
      format: 'cjs',
      preserveModules: true,
      generatedCode: {
        preset: 'es2015',
      }
   },
   {
      dir: `dist`,
      entryFileNames: '[name].mjs',
      format: 'esm',
      preserveModules: true,
      generatedCode: {
        preset: 'es2015',
      }
   },
  ],
  external: [
    "@bugsnag/core/breadcrumb",
    "@bugsnag/core/client",
    "@bugsnag/core/config",
    "@bugsnag/core/event",
    "@bugsnag/core/lib/es-utils/map",
    "@bugsnag/core/lib/es-utils/keys",
    "@bugsnag/core/lib/es-utils/assign",
    "@bugsnag/core/session",
    "@bugsnag/delivery-x-domain-request",
    "@bugsnag/delivery-xml-http-request",
    "@bugsnag/plugin-app-duration",
    "@bugsnag/plugin-browser-context",
    "@bugsnag/plugin-browser-device",
    "@bugsnag/plugin-browser-request",
    "@bugsnag/plugin-browser-session",
    "@bugsnag/plugin-client-ip",
    "@bugsnag/plugin-console-breadcrumbs",
    "@bugsnag/plugin-inline-script-content",
    "@bugsnag/plugin-interaction-breadcrumbs",
    "@bugsnag/plugin-navigation-breadcrumbs",
    "@bugsnag/plugin-network-breadcrumbs",
    "@bugsnag/plugin-simple-throttle",
    "@bugsnag/plugin-strip-query-string",
    "@bugsnag/plugin-window-onerror",
    "@bugsnag/plugin-window-unhandled-rejection"
  ],
})
