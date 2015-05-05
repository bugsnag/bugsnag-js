Bugsnag Notifier for JavaScript
===============================

The Bugsnag Notifier for JavaScript gives you instant notification of errors and
exceptions in your website's JavaScript code.

Bugsnag's JavaScript notifier is incredibly small, and has no external
dependencies (not even jQuery!), and works in all browsers (even mobile browsers!), so you can
safely use it on any website.

[Bugsnag](https://bugsnag.com) captures errors in real-time from your web,
mobile and desktop applications, helping you to understand and resolve them
as fast as possible. [Create a free account](https://bugsnag.com) to start
capturing errors from your applications.

How to Install
--------------

Include `bugsnag.js` from our CDN in the `<head>` tag of your website, before
any other `<script>` tags.

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min.js"
        data-apikey="YOUR-API-KEY-HERE"></script>
```

Make sure to set your Bugsnag API key in the `data-apikey` attribute on the
script tag, or manually set [Bugsnag.apiKey](#apikey).

Now all uncaught exceptions will be sent to Bugsnag, without any further
work from you.

Sending Caught Exceptions or Custom Errors
------------------------------------------

You can easily tell Bugsnag about caught exceptions by calling
`Bugsnag.notifyException`:

```javascript
try {
  // Some code which might throw an exception
} catch (e) {
  Bugsnag.notifyException(e);
}
```

Since many exceptions in JavaScript are named simply `Error`, we also allow
you to provide a custom error name when calling `notifyException`:

```javascript
try {
  // Some code which might throw an exception
} catch (e) {
  Bugsnag.notifyException(e, "CustomErrorName");
}
```

You can also send custom errors to Bugsnag without any exception,
by calling `Bugsnag.notify`:

```javascript
Bugsnag.notify("ErrorName", "Something bad happened here");
```

Both of these functions can also be passed an optional `metaData` object as
the last parameter, which should take the same format as [metaData](#metadata)
described below.

### Severity

You can set the severity of an error in Bugsnag by including the severity option when
notifying bugsnag of the error,

```javascript
Bugsnag.notify("ErrorName", "Something bad happened here", {}, "error");
```

Valid severities are `error`, `warning` and `info`.

Severity is displayed in the dashboard and can be used to filter the error list.
By default all crashes (or unhandled exceptions) are set to `error` and all
`Bugsnag.notify` calls default to `warning`.

Cross-domain errors
-------------------

Browsers obscure some error messages that happen when scripts are loaded
cross-domain. This is for security, but is annoying when hosting javascript on
a CDN. You can tell if this happens because Bugsnag will log to your console:

```
[Bugsnag] Ignoring cross-domain script error.
```

You can fix this by loading your javascript using CORS. We have [detailed
instructions](https://bugsnag.com/docs/notifiers/js/cors) for setting this up.

Browser Support
---------------

Bugsnag can automatically notify you of unhandled exceptions in all versions of
all browsers (yes, even IE 6!). Some browsers let us do even more, and
internally we have 3 tiers of higher quality support:

           | Tier A | Tier B | Tier C | Supported
-----------|:------:|:------:|:------:|:---------:
iOS        | 7+     | 6      | 3-5    | all
Android    | 4.0+   |        | 2.2-3  | all
Blackberry |        | 10     |        | all
IE         | 8+     |        |        | all
Firefox    | 17+    | 6-16   | 3-5    | all
Safari     | 7+     | 6      | 5      | all
Chrome     | 14+    |        |        | all
Opera      | 13+    | 10-12  |        | all
Cumulative | 82.9%  | 91.2%  | 96.4%  | 100%

Most users are on tier A or B browsers (91.2%), errors from these browsers are
deduplicated most effectively, and there's lots of debugging information
available.

A number of people are still on tier C (%5.2%) or worse (3.6%) browsers (though
those proportions will diminish over time). We can still notify you of problems
in these browsers, though the quality is significantly lower.

If you're only targetting up-to-date users, you can tell Bugsnag to only report
errors from modern browsers by going to "Settings -> Error Handling"

Configuration
-------------

###apiKey

Set your Bugsnag API key. You can find your API key on your dashboard.

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min.js"
        data-apikey="YOUR-API-KEY-HERE"></script>
```

In situations where Bugsnag is not in its own script tag, you can set
this with:

```javascript
Bugsnag.apiKey = "YOUR-API-KEY-HERE";
```

###autoNotify

By default, we will automatically notify Bugsnag of any JavaScript errors that
get sent to `window.onerror`. If you want to stop this from happening, you can
set `autoNotify` to `false`:

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min.js"
        data-apikey="YOUR-API-KEY-HERE"
        data-autonotify="false"></script>
```

In situations where Bugsnag is not in its own script tag, you can set
this with:

```javascript
Bugsnag.autoNotify = false;
```

###user

Information about the current user. This data will be sent to Bugsnag with
exception reports so that you can see who was affected by a particular error
and search for problems seen by a given user.

```javascript
Bugsnag.user = {
  id: 7,
  name: "Conrad Irwin",
  email: "conrad@bugsnag.com"
};
```

###metaData

Set additional meta-data to send to Bugsnag with every error. You can use this
to add custom tabs of data to each error on your Bugsnag dashboard to help you
debug.

This should be an object of objects, the outer object should
represent the "tabs" to display on your Bugsnag dashboard, and the inner
objects should be the values to display on each tab, for example:

```javascript
Bugsnag.metaData = {
  account: {
    name: "Bugsnag",
    plan: "premium",
    beta_access: true
  }
};
```

###releaseStage

If you would like to distinguish between errors that happen in different
stages of the application release process (development, production, etc)
you can set the `releaseStage` that is reported to Bugsnag.

```javascript
Bugsnag.releaseStage = "development";
```

By default this is set to be "production".

###notifyReleaseStages

By default, we will notify Bugsnag of exceptions that happen in any
`releaseStage`. If you would like to change which release stages notify
Bugsnag of errors you can set `notifyReleaseStages`:

```javascript
Bugsnag.notifyReleaseStages = ["development", "production"];
```

###appVersion

Setting the `appVersion` lets you see at a glance when errors first and last
happened in your code. You can do this either in the script-tag:

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min.js"
        data-apikey="YOUR-API-KEY-HERE"
        data-appversion="2.0.14"></script>
```

Or in javascript:

```javascript
Bugsnag.appVersion = "2.0.14";
```

###beforeNotify

To have more fine grained control over what errors are sent to Bugsnag, you can
implement a `beforeNotify` function. If you want to halt the notification completely,
return `false` from this function.

```javascript
Bugsnag.beforeNotify = function(payload) {
  // Example: Only notify Bugsnag of errors in `app.js` or `vendor.js` files
  var match = payload.file.match(/app\.js|vendor\.js/i);
  return !!(match && match[0].length > 0);
}
```

You can modify the `payload` or `metaData` by editing the parameters.

```javascript
Bugsnag.beforeNotify = function(payload, metaData) {
  // Filter out sensitive information
  payload.url = "http://redacted.com";
}
```

The `payload` parameter contains the error's `name`, `message`, `file` and
`lineNumber` where available, as well as some additional fields that we either
show on your Bugsnag dashboard, or use for grouping.

###groupingHash

If the metaData hash has a key `groupingHash` it will be used to override the
default grouping on Bugsnag.com. Exceptions with the same grouping hash will be
grouped together into one error. You should not normally need to change this.

```javascript
Bugsnag.notifyException(e, {groupingHash: e.message});
```

By default errors will be grouped by the statement in your code that raised the
error.  We try to fetch the javascript and use the surrounding code to identify
the statement, but if that's not possible we fall back to using line number and
filename as an approximation.

###endpoint

The endpoint option causes the Bugsnag notifier to send errors to a different
web address. By default the address is set to `https://notify.bugsnag.com/js`,
but you can change it to point to an on-premise installation of Bugsnag:

```javascript
Bugsnag.endpoint = "https://bugsnag.local:49000/js";
```

###projectRoot

By default, Bugsnag sets the projectRoot to the current host address (protocol
& the domain). For example, `https://example.com` is the projectRoot for all
errors that occur within the `example.com` domain.

```javascript
Bugsnag.projectRoot = "http://example.com";
```

###context

By default, Bugsnag sets the context to the current page's pathname, otherwise
referred to as `location.pathname`. Note: `location.pathname` does not include
any search parameters or the page's fragment identifier.

```javascript
Bugsnag.context = "/path/to/my/page.php";
```

noConflict Support
------------------

Bugsnag has a `noConflict` function for removing itself from the `window` object
and restoring the previous binding. This is intended for use in environments
where developers can't assume that Bugsnag isn't in use already (such as 3rd
party embedded javascript) and want to control what gets reported to their
Bugsnag account.

The object returned from `noConflict()` is the full Bugsnag object so can be
used in the same way:

```javascript
var myBugsnag = Bugsnag.noConflict();
// window.Bugsnag is now bound to what it was before the bugsnag script was loaded.
myBugsnag.apiKey = "my-special-api-key";
try {
  // highly volatile code
} catch (e) {
  myBugsnag.notifyException(e, "OhNoes");
}
```

AMD/CommonJS support
--------------------

Bugsnag can be loaded as-is using an AMD or CommonJS compatible loader. This means
you can use it with tools like RequireJS and Browserify directly. If you want to
load Bugsnag from the CDN but load the rest of your code using AMD, then
you should ensure Bugsnag is required before the rest of your code.

If you load Bugsnag after the rest of your code, and your AMD loader leaks the global
`define` function then you may see the (harmless) error message:
"Mismatched anonymous define() module".  To fix this, load Bugsnag before the
rest of your code.

Script tag support
------------------

By default Bugsnag sends the contents of inline script tags on the page to our
servers to help with analysis and debugging. If you don't want this to happen,
set `inlinescript` to false.

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min.js"
        data-inlinescript="false"></script>
```

Notifying Bugsnag about jQuery Ajax errors
------------------------------------------

If you're [using jQuery to send Ajax requests](http://api.jquery.com/ajaxerror/), we recommend hooking Bugsnag up to notify about `ajaxError`'s.

```
$( document ).ajaxError(function(event, jqxhr, settings, thrownError) {
  Bugsnag.notify("AjaxError", thrownError);
});
```

Sourcemaps
----------

Bugsnag supports [source
maps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/) to
reverse javascript minification. If you include a magic comment at the end of
your javascript file that points to the location of a source map, we will
expand the lines in your stacktrace.

For an example of how this should look, you can see the comment at the bottom
of [bugsnag.js](https://gist.githubusercontent.com/jessicard/10924962/raw/6826aa6d934d95d9e39cdef1bb6a1991c3d4fd7e/bugsnag-2.1.0.min.js) itself.
Most modern minifiers support source maps, we use [UglifyJS2](https://github.com/mishoo/UglifyJS2).

To support source maps Bugsnag needs to download both your minified code and
your source maps. It doesn't need to fetch your original source files.
Legitimate Bugsnag requests originate from the IP address `107.22.198.224` if
you need to open up your firewall to allow access.

Advanced hosting
----------------

We will occasionally update bugsnag-2.js on the CDN to improve the quality of
our notifier without breaking backward compatibility. If you need assurance
that the javascript will never change, feel free to include the specific version
directly.

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.4.8.min.js"
        data-apikey="YOUR-API-KEY-HERE"></script>
```

If you have specific requirements for Javascript, you're welcome to host
versions of bugsnag-js on your own site or CDN.

If you'd like to avoid an extra blocking request, you can include the javascript
in your asset compilation process so that it is inlined into your existing script
files. The only thing to be sure of is that Bugsnag is included before your
onload handlers run.  This is so that we can report stacktraces reliably.

Rate limiting
-------------

By default only 10 errors are allowed per page load. This is to prevent wasting
a user's bandwidth sending thousands of exceptions to Bugsnag. If you have a long-running
single page app, you can reset this rate-limit from your router by using:

```
Bugsnag.refresh()
```

Reporting Bugs or Feature Requests
----------------------------------

Please report any bugs or feature requests on the github issues page for this
project here:

<https://github.com/bugsnag/bugsnag-js/issues>


Contributing
------------

-   [Fork](https://help.github.com/articles/fork-a-repo) the [notifier on github](https://github.com/bugsnag/bugsnag-js)
-   Make sure your changes support older browsers, avoid any [unsupported methods](http://kangax.github.com/es5-compat-table/#showold)
-   Make sure all tests pass by building (`npm install`, `grunt`), and tests are passing (`grunt test`)
-   Commit and push until you are happy with your contribution
-   [Make a pull request](https://help.github.com/articles/using-pull-requests)
-   Thanks!


License
-------

The Bugsnag JavaScript notifier is free software released under the MIT License.
See [LICENSE.txt](https://github.com/bugsnag/bugsnag-js/blob/master/LICENSE.txt) for details.
