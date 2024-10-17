declare module '@bugsnag/core/config' {
  export const schema: any
}

declare module '@bugsnag/plugin-window-onerror' {
  export default function pluginWindowOnerror(): any
}

declare module '@bugsnag/plugin-window-unhandled-rejection' {
  export default function pluginUnhandledRejection(): any
}

declare module '@bugsnag/plugin-app-duration' {
  export default function pluginApp(): any
}

declare module '@bugsnag/plugin-browser-device' {
  export default function pluginDevice(): any
}

declare module '@bugsnag/plugin-browser-context' {
  export default function pluginContext(): any
}

declare module '@bugsnag/plugin-browser-request' {
  export default function pluginRequest(): any
}

declare module '@bugsnag/plugin-simple-throttle' {
  export default function pluginThrottle(): any
}

declare module '@bugsnag/plugin-console-breadcrumbs' {
  export default function pluginConsoleBreadcrumbs(): any
}

declare module '@bugsnag/plugin-network-breadcrumbs' {
  export default function pluginNetworkBreadcrumbs(): any
}

declare module '@bugsnag/plugin-navigation-breadcrumbs' {
  export default function pluginNavigationBreadcrumbs(): any
}

declare module '@bugsnag/plugin-interaction-breadcrumbs' {
  export default function pluginInteractionBreadcrumbs(): any
}

declare module '@bugsnag/plugin-inline-script-content' {
  export default function pluginInlineScriptContent(): any
}

declare module '@bugsnag/plugin-browser-session' {
  export default function pluginSession(): any
}

declare module '@bugsnag/plugin-client-ip' {
  export default function pluginIp(): any
}

declare module '@bugsnag/plugin-strip-query-string' {
  export default function pluginStripQueryString(): any
}
