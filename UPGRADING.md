Upgrading
=========

## 7.x to 8.x

### node

This version contains major improvements to the node notifier, including making the top-level `Bugsnag` static interface context-aware and enabling breadcrumbs for node projects.

The minimum supported node version is now v12.17.0.

#### context-aware `Bugsnag` calls

When using `plugin-express`, `plugin-koa`, `plugin-restify`, or `plugin-contextualize`, a clone of the top-level Bugsnag client is made so that any subsequent changes made to the client (such as attaching metadata) only affect the scope of the current web request (or a function call, when using `plugin-contextualize`).

Prior to `bugsnag-js` v8, calls made to the top-level `Bugsnag` static interface were not aware of this context so users had to ensure they were calling methods on the correct client instance, i.e. the cloned client that was made available on `req.bugsnag` (or `ctx.bugsnag` for koa). This wasn't ideal because if you wanted to interact with Bugsnag in some function deep in a call stack you would have to pass `req.bugsnag` all the way down, as calling `Bugsnag.notify` would not have contained the request metadata gathered by the plugin. With version 8 of the notifier, top-level calls to `Bugsnag` are now context-aware. This means you can call `Bugsnag.notify` (or `Bugsnag.leaveBreadcrumb` etc.), and, if it was called within a context, the call will be forwarded to the correct cloned version of that client (i.e. for the particular request from which the call originated).

Express

```diff
app.get('/handled', function (req, res) {
- req.bugsnag.notify(new Error('handled'))
+ Bugsnag.notify(new Error('handled'))
})
```

Koa

```diff
app.use(async (ctx, next) => {
  if (ctx.path === '/handled') {
-    ctx.bugsnag.notify(new Error('handled'))
+    Bugsnag.notify(new Error('handled'))
    await next()
  } else {
    await next()
  }
})
```

Notes

* `req.bugsnag` (and `ctx.bugsnag` in koa) is still present in version 8 of `bugsnag-js`, so you can continue using these as before.
* There are rare situations on Express servers when this contextual storage can get lost, causing the data stored to become server-scoped and so affect all threads that are being executed. See our [online docs](https://docs.bugsnag.com/platforms/javascript/express/node-async/#context-loss-in-express-servers) for full details.

#### breadcrumb support

Breadcrumb support has been enabled for node. This means you can call `Bugsnag.leaveBreadcrumb` to attach short log statements to each error report to help diagnose what events led to the error.  

Currently no breadcrumbs are automatically collected in node.

## `bugsnag-react-native@*` to `@bugsnag/react-native@7.3`

As of `v7.3` of the [`bugsnag-js` monorepo](https://github.com/bugsnag/bugsnag-js) it contains Bugsnag's SDK for React Native. This additional notifier joins `@bugsnag/js` and `@bugsnag/expo` in its unified version scheme, so the first version of `@bugsnag/react-native` is `v7.3.0`.

The previous Bugsnag React Native SDK – [`bugsnag-react-native`](https://github.com/bugsnag/bugsnag-react-native) – continues to be available and will receive critical bug fixes, but it is no longer under active development and won't receive new features.

See the [React Native upgrade guide](/packages/react-native/UPGRADING.md) for specific instructions on how to upgrade from `bugsnag-react-native` to `@bugsnag/react-native`.

#### plugin-contextualize

Unhandled errors that occur within a contextualize context now respect the `autoDetectErrors`` and `enabledErrorTypes`` configuration options. Previously unhandled errors would have been caught regardless of the configuration.

## 7.0 to 7.1

This release contains an update to the way the React and Vue plugins work, allowing the reference to the framework to be supplied after Bugsnag has been initialized.

### Types

From a JS perspective, the update is backwards compatible. Despite being compatible at runtime, the change to type definitions will cause a compile error when TypeScript is used in conjunction with `@bugsnag/plugin-react`. The error is straightforward to resolve:

```TypeScript
// WRONG: return type was 'any', this will now fail to compile
const ErrorBoundary = Bugsnag.getPlugin('react')

// OK: to use exactly the same logic you will need to cast
const ErrorBoundary = Bugsnag.getPlugin('react') as unknown as React.Component

// RECOMMENDED: to make use of the provided type definitions, update to the new api
const ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary()
```

_Note the use of the `!` operator._ The `getPlugin('react')` call will only return something if the react plugin was provided to `Bugsnag.start({ plugins: […] })`.

### Plugins

In order to work, the React and Vue plugins both require a reference to the respective framework to be passed in. This was required in the constructor, which meant there was no way to load Bugsnag _before_ the framework. To support this, we now support supplying the framework reference _after_ Bugsnag has started.

Note that the existing usage is still supported.

#### React

```diff
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import * as React from 'react'

Bugsnag.start({
  apiKey: 'YOUR_API_KEY',
  plugins: [
-     new BugsnagPluginReact(React)
+     new BugsnagPluginReact()
  ]
})

- const ErrorBoundary = Bugsnag.getPlugin('react')
+ const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)
```

#### Vue

```diff
import Bugsnag from '@bugsnag/js'
import BugsnagPluginVue from '@bugsnag/plugin-vue'
import Vue from 'vue'

Bugsnag.start({
  apiKey: 'YOUR_API_KEY',
  plugins: [
-     new BugsnagPluginVue(Vue)
+     new BugsnagPluginVue()
  ]
})

+ Bugsnag.getPlugin('vue').installVueErrorHandler(Vue)
```

## 6.x to 7.x

__This version contains many breaking changes__. It is part of an effort to unify our notifier libraries across platforms, making the user interface more consistent, and implementations better on multi-layered environments where multiple Bugsnag libraries need to work together (such as React Native).

__As a result of upgrading, your project may see new error groups for existing errors.__ This is because JavaScript errors are grouped by comparing the surrounding code.

### New static interface

In most applications, the desire is to create a single Bugsnag client – it's rare that you'd want to instantiate multiple clients. We've made static initialization the primary interface, so that the user experience is optimized around the main use case – creating a single client:

```diff
- import bugsnag from '@bugsnag/js'
+ import Bugsnag from '@bugsnag/js'

- const bugsnagClient = bugsnag(/ * opts */)
+ Bugsnag.start(/ * opts */)
```

You can choose to hold on to the `Client` returned by `Bugsnag.start()`, or not. After ensuring `Bugsnag.start()` is called first, you can call any `Client` method on the static interface, which forwards the method call onto the initialized client:

- `Bugsnag.notify()`
- `Bugsnag.leaveBreadcrumb()`
- `Bugsnag.startSession()`, `Bugsnag.pauseSession()`, `Bugsnag.resumeSession()`
- `Bugsnag.setContext()`, `Bugsnag.getContext()`
- `Bugsnag.setUser()`, `Bugsnag.getUser()`
- `Bugsnag.addMetadata()`, `Bugsnag.getMetadata()`, `Bugsnag.clearMetadata()`
- `Bugsnag.getPlugin()`

A common pattern when implementing Bugsnag pre-v7 is to do something like the following, initializing a Bugsnag client which can then be imported in various parts of the application:

**lib/bugsnag.js**
```js
// OLD EXAMPLE
import bugsnagClient from '@bugsnag/js'
const bugsnagClient = bugsnag(/* your opts here */)
export bugsnagClient
```

**index.js**
```js
// OLD EXAMPLE
import bugsnagClient '/lib/bugsnag'
import HelloWorld from './components/HelloWorld'
bugsnagClient.leaveBreadcrumb('App starting…')
```

**components/HelloWorld.js**
```js
// OLD EXAMPLE
import bugsnagClient from '/lib/bugsnag'
export function render () {
  bugsnagClient.notify(new Error('render failed'))
}
```

This update means `lib/bugsnag.js` can go away. As long as you ensure `Bugsnag.start()` is called first, you can simply do:

**index.js**
```js
// NEW EXAMPLE
import Bugsnag from '@bugsnag/js'
Bugsnag.start(/* your opts here */)
Bugsnag.leaveBreadcrumb('App starting…')
```

**components/HelloWorld.js**
```js
// NEW EXAMPLE
import Bugsnag from '@bugsnag/js'
export function render () {
  Bugsnag.notify(new Error('render failed'))
}
```

If you need to create multiple clients, you can use the `Bugsnag.createClient(…)` method:

```diff
- const bugsnagClient = bugsnag(/* opts */)
+ const bugsnagClient = Bugsnag.createClient(/* opts */)
```

### Options

Many options have been renamed, reworked or replaced.

```diff
  {
-   notifyReleaseStages: ['staging','production'],
+   enabledReleaseStages: ['staging','production'],

-   autoNotify: false,
+   autoDetectErrors: false,

    // When autoDetectErrors is true, this option
    // sets which kinds of errors to detect
+   enabledErrorTypes: {
+     unhandledExceptions: false,
+     unhandledRejections: false
+   },

-   autoBreadcrumbsEnabled: false,
-   consoleBreadcrumbsEnabled: false,
-   interactionBreadcrumbsEnabled: false,
-   navigationBreadcrumbsEnabled: false,
-   networkBreadcrumbsEnabled: false,
+   enabledBreadcrumbTypes: [
+     'navigation', 'request', 'process', 'log', 'user', 'state', 'error', 'manual'
+   ],

-   autoCaptureSessions: false,
+   autoTrackSessions: false,

    // beforeSend callbacks have been renamed to onError
    // and now receive an event parameter rather than report
-   beforeSend: (report) => {}
+   onError: (event) => {}

-   filters: [],
+   redactedKeys: []

-   metaData: {},
+   metadata: {},

+   onSession: (session) => {
+     // a callback to run each time a session is created
+   }

+   onBreadcrumb: (breadcrumb) => {
+     // a callback to run each time a breadcrumb is created
+   }

    // plugins must now be supplied in config rather than via client.use()
+   plugins: []
  }
```

### Mutable state

Before, `app`, `device`, `request`, `user`, `metaData` and `context` were simply properties hanging off of the client that could be mutated at-will. Now, their structure and how/where they are set is more strictly controlled.

#### App

`version`, `type` and `releaseStage` can now _only_ be supplied in configuration and are deemed immutable after the client has been initialized.

```diff
- bugsnagClient.app.version = '1.2.3'
+ Bugsnag.start({ appVersion: '1.2.3' })
```

```diff
- bugsnagClient.app.releaseStage = 'staging'
+ Bugsnag.start({ releaseStage: 'staging' })
```

```diff
- bugsnagClient.app.type = 'worker'
+ Bugsnag.start({ appType: 'worker' })
```

The `app` section of the payload is now reserved for properties defined by Bugsnag. If you want to send information to be displayed under the "App" tab in the dashboard, provide it under an `app` section in metadata.

```diff
- bugsnagClient.app.gitSha = 'c6f0f2'
+ Bugsnag.addMetadata('app', 'gitSha', 'c6f0f2')
```

The app data provided in config and collected automatically by Bugsnag is accessible in `onError` callbacks under the `event.app` property. Any data that needs to be inspected, removed or changed can be done here if necessary.

#### Device

Similarly, the `device` section of the payload is now reserved for properties defined by Bugsnag. If you want to send information to be displayed under the "Device" tab in the dashboard, provide it under a `device` section in metadata.

```diff
- bugsnagClient.device.browserPlugins = navigator.plugins
+ Bugsnag.addMetadata('device', 'browserPlugins', navigator.plugins)
```

The device data collected automatically by Bugsnag is accessible in `onError` callbacks under the `event.device` property. Any data that needs to be inspected, removed or changed can be done here if necessary.

#### User

Setting a user's `id`, `email` and `name` must now be done via the `setUser(id, email, name)` method. If you want to send more information to be displayed under the "User" tab in the dashboard, provide it under a `user` section in metadata.

```diff
- client.user = { id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag', roles: [ 'admin', 'subscriber' ] }
+ Bugsnag.setUser('123', 'bug@sn.ag', 'Bug S. Nag')
+ Bugsnag.addMetadata('user', 'roles', [ 'admin', 'subscriber' ])
```

It remains possible to specify the user `{ id, email, name }` in configuration:

```diff
- bugsnag({
+ Bugsnag.start({
    user: {
      id: '123',
      email: 'bug@sn.ag',
      name: 'Bug S. Nag'
    }
  })
```

#### Metadata

The consistent mis-capitalisation of "metaData" has been corrected to "metadata" 🎉

The `client.metaData` property has now been removed, and metadata is managed via the following methods, which control the metadata which is attached to every event:

```js
Bugsnag.addMetadata(section, key, value)
Bugsnag.addMetadata(section, { [key]: value, …})
Bugsnag.getMetadata(section, key)
Bugsnag.clearMetadata(section, key)
```

The same methods are available on an event, to control the metadata that is included with only that event:

```js
event.addMetadata(section, key, value)
event.addMetadata(section, { [key]: value, … })
event.getMetadata(section, key)
event.clearMetadata(section, key)
```

It remains possible to supply initial metadata in configuration:

```diff
- bugsnag({
+ Bugsnag.start({
-   metaData: {
+   metadata: {
      section: { key: value }
    }
  })
```

Previously, it was possible to add "top-level" metadata, i.e. data that you did not provide a specific `section` name for. In the dashboard, this would display under a tab with the heading "Custom". Since a section name is now required, for continuity both visually and for any custom filters you may have set up based on such data, you should set the section name to `'custom'`:

```diff
- bugsnagClient.metaData = { processId: 'aa874cbd', role: 'image-resizer' }
+ Bugsnag.addMetadata('custom', { processId: 'aa874cbd', role: 'image-resizer' })
```

#### Context

On the client, context is now managed via `get/setContext()`:

```diff
- client.context = 'Account > Manage addresses'
+ Bugsnag.setContext('Account > Manage addresses')
```

In an `onError` callback, `event.context` is simply a property that can be mutated directly.

```diff
- report.context = document.location.href
+ event.context = document.location.href
```

And it remains possible to supply initial context in configuration:

```diff
- bugsnag({
+ Bugsnag.start({
    context: document.location.href
  })
```

Note that by manually setting context at any point, this will switch off any automatic context setting.

### `notify()` signature and `onError`

The signature of `notify()` has changed. Before, the second parameter `opts` allowed specifying some of the report's properties, as well as a callback to run. Now, the only way to provide extra information to an error report is to provide a callback to run. `onError` is the new name for `beforeSend` and it now receives an `event`, the new name for `report`.

```diff
- bugsnagClient.notify(err, opts, cb)
+ Bugsnag.notify(err, onError, cb)
```

Here are some examples:

```diff
  // changing severity
- bugsnagClient.notify(err, { severity: 'info' })
+ Bugsnag.notify(err, event => { event.severity = 'info' })

  // adding metadata
- bugsnagClient.notify(err, {
-   metaData: {
-     component: {
-       instanceId: component.instanceId
-     }
-   }
- })
+ Bugsnag.notify(err, event => {
+   event.addMetadata('component', {
+     instanceId: component.instanceId
+   })
+ })

  // preventing send
- bugsnagClient.notify(err, report => {
+ Bugsnag.notify(err, event => {
-   if (report.context === '/test-error-page') {
+   if (event.context === '/test-error-page') {
      return false
    }
  })

  // updating error class/message
- bugsnagClient.notify(err, {
-   beforeSend: report => {
-     report.errorClass = 'MyCustomError'
-     report.errorMessage = 'Something went wrong'
-   }
- })
+ Bugsnag.notify(err, event => {
+   event.errors[0].errorClass = 'MyCustomError'
+   event.errors[0].errorMessage = 'Something went wrong'
+ })
```

And here is the full difference between the report and event interface:

```diff
- class Report {
+ class Event {
    // These properties remain intact and unchanged
    apiKey
    app
    device
    request
    context
    breadcrumbs
    groupingHash
    severity
    originalError

    // the event implements the same metadata methods as the client
-   metaData
-   updateMetaData(section, key, value)
-   removeMetaData(section, key)
+   addMetadata(section, key, value)
+   getMetadata(section, key)
+   clearMetadata(section, key)

    // an event can now contain multiple errors
-   errorClass
-   errorMessage
-   stacktrace
+   errors [
+     { errorClass, errorMessage, stacktrace, type }
+   ]

-   user
+   getUser()
+   setUser(id, name, email)

-   session

    // now the only way to ignore an error report is
    // to return false from an onError callback
-   ignore()
-   isIgnored()
  }
```

### Reset event count

The method to reset the event count, preventing the `maxEvents` limit from being hit has been renamed:

```diff
- bugsnagClient.refresh()
+ Bugsnag.resetEventCount()
```

### Session endpoint

Previously it was valid to supply a `notify` endpoint without supplying a `sessions` endpoint. Now if you supply one, you must supply the other. Note, this only applies when configuring the notifier for Bugsnag On-Premise.

```diff
  {
    endpoints: {
      notify: 'https://custom-bugsnag-notify.yourdom.ain'
+     sessions: 'https://custom-bugsnag-sessions.yourdom.ain'
    }
  }
```

## Plugins

Plugins must now be supplied in configuration, and the `client.use()` method has been removed. For users of the following plugins, some changes are required:

### `@bugsnag/plugin-react`

```diff
- import bugsnagReact from '@bugsnag/plugin-react'
+ import BugsnagPluginReact from '@bugsnag/plugin-react'

- const bugsnagClient = bugsnag('YOUR_API_KEY')
+ Bugsnag.start({ apiKey: 'YOUR_API_KEY', plugins: [new BugsnagPluginReact(React)] })

- bugsnagClient.use(bugsnagReact, React)
```

### `@bugsnag/plugin-vue`

```diff
- import bugsnagVue from '@bugsnag/plugin-vue'
+ import BugsnagPluginVue from '@bugsnag/plugin-vue'

- const bugsnagClient = bugsnag('YOUR_API_KEY')
+ Bugsnag.start({ apiKey: 'YOUR_API_KEY', plugins: [new BugsnagPluginVue(Vue)] })

- bugsnagClient.use(bugsnagVue, Vue)
```

### `@bugsnag/plugin-{restify|koa|express}`

Since these plugins don't need any input, their usage is simpler and follows this pattern

```diff
- bugsnagClient.use(plugin)
+ Bugsnag.start({
+   plugins: [plugin]
+ })
```

---

See the [full documentation](https://docs.bugsnag.com/platforms/javascript) for more information.

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
