## 5.0.0 (TBD)

This is the first release of Bugsnag notifiers under the `@bugsnag` namespace.

This "universal" repository combines Bugsnag's browser and Node.js notifiers and so for continuity with the browser version, which was at v4, **the starting point for this monorepo and all of its packages is `v5.0.0`**.

### Upgrading

There are no external API changes from `bugsnag-js` v4 -> `@bugsnag/js` is very simple.

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

## Node.js

Users of the existing `bugsnag` (node) package should note that this upgrade is **not** backwards compatible and should follow the new [integration guides](https://docs.bugsnag.com/platforms/javascript).
