Upgrading
=========


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
