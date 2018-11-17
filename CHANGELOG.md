## 5.0.0 (TBD)

This is the first release of Bugsnag notifiers under the `@bugsnag` namespace.

This "universal" repository combines Bugsnag's browser and Node.js notifiers and so for continuity with the browser version, which was at v4, **the starting point for this monorepo and all of its packages is `v5.0.0`**.

### Upgrading

There are minimal external API changes from `bugsnag-js` v4 -> `@bugsnag/js`, so the migration is very simple.

#### CDN users

Users of the CDN just need to update the link:

```diff
+ https://d2wy8f7a9ursnm.cloudfront.net/v4.7.3/bugsnag.min.js
- https://d2wy8f7a9ursnm.cloudfront.net/v5.0.0/bugsnag.min.js
```

#### npm/yarn users

Users of the `bugsnag-js` browser JS package will need to remove that dependency and add `@bugsnag/js`.

```
# npm
npm rm --save bugsnag-js
npm install --save @bugsnag/js

# yarn
yarn remove bugsnag-js
yarn add @bugsnag/js
```

Subsequently, in the application, any requires/imports should be updated (this should be a simple find and replace):

```diff
+ import bugsnag from "@bugsnag/js"
- import bugsnag from "bugsnag-js"
```

```diff
+ var bugsnag = require('@bugsnag/js')
- var bugsnag = require('bugsnag-js')
```

### bugsnag-{vue|react|angular} users

The plugin interface has changed slightly and these packages have been migrated to the @bugsnag namespace.

Remove the old module and install the new module:

```
# npm
npm rm --save bugsnag-{vue|react|angular}
npm install --save @bugsnag/plugin-{vue|react|angular}

# yarn
yarn remove bugsnag-{vue|react|angular}
yarn add @bugsnag/plugin-{vue|react|angular}
```

#### Vue

```diff
+ const bugsnagVue = require('@bugsnag/plugin-vue')
- const bugsnagVue = require('bugsnag-vue')

+ bugsnagClient.use(bugsnagVue, Vue)
- bugsnagClient.use(bugsnagVue(Vue))
```

#### React

```diff
+ const bugsnagReact = require('@bugsnag/plugin-react')
- const bugsnagReact = require('bugsnag-react')

+ bugsnagClient.use(bugsnagReact, React)
- bugsnagClient.use(bugsnagReact(React))

+ const ErrorBoundary = bugsnagClient.getPlugin('react')
- const ErrorBoundary = bugsnagClient.use(createPlugin(React))
```

#### Angular

```diff
+ import { BugsnagErrorHandler } from '@bugsnag/plugin-angular'
- import BugsnagErrorHandler from 'bugsnag-angular'
```

## Node.js

Users of the existing `bugsnag` (node) package should note that this upgrade is **not** backwards compatible and should follow the new [integration guides](https://docs.bugsnag.com/platforms/javascript).

Please note the signature of the `notify()` function is similar, but has some noteworthy differences:

`bugsnagClient.notify(error, opts)`

- Previously `metaData` could be provided by passing arbitrary keys to `opts`. Now, it must be passed explicitly as `opts.metaData`.
- `groupingHash` is no longer an option, but it can be set using `report.groupingHash` in a `beforeSend` callback.

Please refer to the documentation, since `notify()` will ignore `opts` that it doesn't recognize.
