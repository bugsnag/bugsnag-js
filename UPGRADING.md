Upgrading
=========

## 5.x to 6.x

__This change only affects users that are sending via a proxy in Node.__

The only major change from 5 to 6 is the removal of [`request`](https://github.com/request/request) from the `@bugsnag/delivery-node`. This means that no changes are required for users of the browser package.

Only if you were using the `proxy` option or an `http(s)_proxy` environment variable in Node do you need to make changes.

From now on, you need to supply a proxy agent, which Bugsnag will use for all its HTTP(s) requests. For example:

```diff
+ const HttpsProxyAgent = require('https-proxy-agent')
  const bugsnagClient = bugsnag({
-   proxy: 'http://corporate-proxy:3128/'
+   agent: new HttpsProxyAgent('http://corporate-proxy:3128/')
  })
```

## 4.x to 5.x

`@bugsnag/js` v5 is the first "universal" JavaScript release.

There are minimal external API changes from `bugsnag-js` v4 -> `@bugsnag/js`, so the migration is very simple.

Upgrading from `bugsnag-node` requires a more significant update.

#### CDN users

Users of the CDN just need to update the link:

```diff
- https://d2wy8f7a9ursnm.cloudfront.net/v4.7.3/bugsnag.min.js
+ https://d2wy8f7a9ursnm.cloudfront.net/v5.0.0/bugsnag.min.js
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
- import bugsnag from "bugsnag-js"
+ import bugsnag from "@bugsnag/js"
```

```diff
- var bugsnag = require('bugsnag-js')
+ var bugsnag = require('@bugsnag/js')
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
- const bugsnagVue = require('bugsnag-vue')
+ const bugsnagVue = require('@bugsnag/plugin-vue')

- bugsnagClient.use(bugsnagVue(Vue))
+ bugsnagClient.use(bugsnagVue, Vue)
```

#### React

```diff
- const bugsnagReact = require('bugsnag-react')
+ const bugsnagReact = require('@bugsnag/plugin-react')

- bugsnagClient.use(bugsnagReact(React))
+ bugsnagClient.use(bugsnagReact, React)

- const ErrorBoundary = bugsnagClient.use(createPlugin(React))
+ const ErrorBoundary = bugsnagClient.getPlugin('react')
```

#### Angular

```diff
- import BugsnagErrorHandler from 'bugsnag-angular'
+ import { BugsnagErrorHandler } from '@bugsnag/plugin-angular'
```

#### Node.js

Users of the existing `bugsnag` (node) package should note that this upgrade is **not** backwards compatible and should follow the new [integration guides](https://docs.bugsnag.com/platforms/javascript).

Please note the signature of the `notify()` function is similar, but has some noteworthy differences:

`bugsnagClient.notify(error, opts)`

- Previously `metaData` could be provided by passing arbitrary keys to `opts`. Now, it must be passed explicitly as `opts.metaData`.
- `groupingHash` is no longer an option, but it can be set using `report.groupingHash` in a `beforeSend` callback.

Please refer to the documentation, since `notify()` will ignore `opts` that it doesn't recognize.

#### TypeScript

TypeScript definitions are bundled with each of the published modules and should "just work".

## 3.x to 4.x

*Our JS library has gone through some major improvements, and there are some changes you'll need to make to get onto the new version.*

#### Getting the new notifier

If you're loading Bugsnag from the CDN you may have got used to transparent rolling updates. Since this is a major update with breaking changes, you'll need to update the URL your script tag is pointing to. Be sure to also make changes to your application where it configures and uses the Bugsnag client!

```diff
- <script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js" data-apikey="API_KEY"></script>
+ <script src="//d2wy8f7a9ursnm.cloudfront.net/v4/bugsnag.min.js"></script>
+ <script>window.bugsnagClient = bugsnag('API_KEY')</script>
```

##### npm/yarn

If you're using a package manager, you should run something like

```
npm install --save bugsnag-js@4
# or
yarn add bugsnag-js@4
```

#### Manual startup

Before, the client would simply "exist" already on the page – like a singleton. Now you have to explicitly create your client with some configuration options (or simply an API key).

This might seem like a little more work, but it gives you more granular control:
- Bugsnag won't start until you tell it to.
- It will do exactly as its told based on the config provided. Previously, it would start doing all the default behavior and you'd have to go and switch it all off, which was rather messy.
- There's now no lost-in-translation in the options. The options are declared as JS values rather than being extracted from strings, which should mean fewer surprises.

```diff
- <script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js" data-apikey="API_KEY"></script>
+ <script src="//d2wy8f7a9ursnm.cloudfront.net/v4/bugsnag.min.js"></script>
<script>
-  Bugsnag.notify(err)
+  window.bugsnagClient = bugsnag('API_KEY')
+  bugsnagClient.notify(err)
</script>
```

#### Configuration

We've changed how our configuration system works.

As mentioned, we've removed the ability to configure the library with HTML attributes. Additionally many of the configuration options have been updated or changed.

All options are now provided by a single configuration object passed to the client.

Here's an example of how to configure the library with the most common options:

```js
window.bugsnagClient = bugsnag({
  apiKey: 'API_KEY',
  appVersion: '1.2.3',
  releaseStage: 'staging',
  notifyReleaseStages: [ 'staging', 'production' ],
  metaData: { /* some metaData to attach to every report */ },
  user: { id: '123', name: 'B. Nag', email: 'bugs.nag@bugsnag.com' },
  beforeSend: function (report) { /* amend or ignore the report */ }
})
```

See the full [configuration options](https://docs.bugsnag.com/platforms/browsers/js/configuration-options/) documentation for more information.

#### Usage

The only methods supported to report errors and leave breadcrumbs now are:

```js
bugsnagClient.notify(err, opts)
bugsnagClient.leaveBreadcrumb('name', { /* metaData */ })
```

That means the following usage is __DEPRECATED__:

```js
Bugsnag.notifyException(err)
Bugsnag.notify(name, message)
```

To convert examples of this usage, do the following:

```diff
- Bugsnag.notifyException(err)
+ bugsnagClient.notify(err)
```

```diff
- Bugsnag.notify('NetworkError', 'max retries exceeded')
+ bugsnagClient.notify({ name: 'NetworkError', message: 'max retries exceeded'})
```
##### Customizing errors

Previously, `notify`/`notifyException` could be called in different ways to set `severity` and `metaData`. Now there is one consistent `opts` object structure to customize reports:

```diff
- Bugsnag.notifyException(err, {
-   'special info': {
-     request_id: 12345,
-     message_id: 854
-   }
- }, 'warning')
+ bugsnagClient.notify(err, {
+   severity: 'warning',
+   metaData: {
+     'special info': {
+       request_id: 12345,
+       message_id: 854
+     }
+   }
+ })
```

Refer to the [exact spec of the `opts` object](https://docs.bugsnag.com/platforms/browsers/js/reporting-handled-errors/) for more information.

#### Dropping support for IE6/7

v1 to 3 of the notifier valiantly supported IE 6 and 7. However, supporting these ~old~ ancient browsers came with some pretty serious caveats. Now that we’ve dropped support, we're able to move the library forward and make our reporting delivery mechanism more robust.

If you’re still supporting users on IE6/7, you can still use v3. We will continue to support v3 along side v4, however it will enter "maintenance" mode where no new features will be added. For more information, see the [v3 integration guide](https://docs.bugsnag.com/platforms/browsers/v3/).

#### Endpoint

Before, due to the esoteric payload format the JS notifier would post to a JS-specific route (`/js`) on the notify server. Now, payload has been homogenized, so requests go to the root (`/`) of the notify host like reports from other platforms.

For hosted Bugsnag, the default URL is now `//notify.bugsnag.com`. If you didn't configure this, you shouldn't need to make a change. For On-Premise, after updating the latest version make sure you configure `endpoint` _without_ `/js` in the URL.


```diff
- endpoint: '//notify-bugsnag.example.com/js'
+ endpoint: '//notify-bugsnag.example.com'
```
