# @bugsnag/browserlite

A lightweight build of the Bugsnag error reporter for browser JavaScript.

Unlike `@bugsnag/browser`, this package only bundles the plugins required for
basic, unhandled error capture (`plugin-window-onerror` and
`plugin-window-unhandled-rejection`) plus delivery. Everything else that
`@bugsnag/browser` includes by default — breadcrumbs, device/context
metadata, session tracking, client IP collection, query string stripping,
inline script tracking, etc. — is left out so you only pay for what you use.

## Usage

Install only the plugins you need alongside `@bugsnag/browserlite` and pass
them in via the `plugins` config option:

```js
const Bugsnag = require('@bugsnag/browserlite')
const pluginBrowserSession = require('@bugsnag/plugin-browser-session')
const pluginNetworkBreadcrumbs = require('@bugsnag/plugin-network-breadcrumbs')

Bugsnag.start({
  apiKey: 'YOUR_API_KEY',
  plugins: [pluginBrowserSession, pluginNetworkBreadcrumbs()]
})
```

If you want the full, batteries-included experience, use `@bugsnag/browser`
instead.

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
