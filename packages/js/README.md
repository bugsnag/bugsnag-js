# @bugsnag/js

Universal JavaScript notifier.

This package contains both `@bugsnag/browser` and `@bugsnag/node` and the appropriate one will be included in your application.

## Node.js

In Node, importing `'@bugsnag/js'` will provide the [`@bugsnag/node`](../node) module.

## Browser

In various bundlers, importing `'@bugsnag/js'` will provide the [`@bugsnag/browser`](../browser) module.

| Bundler  | Support |
| ---------- | -------------- |
| Browserify | Supports the package.json `"browser"` field by default |
| Webpack | Supports the package.json `"browser"` field by default |
| Rollup | Set `browser: true` in the [node-resolve plugin](https://github.com/rollup/rollup-plugin-node-resolve) |

**Note**: by using this browser-specific entrypoint, none of the node-specific code will be included in your bundle.

## License
MIT
