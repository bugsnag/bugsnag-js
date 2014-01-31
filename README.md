Bugsnag Notifier for JavaScript
===============================

The Bugsnag Notifier for JavaScript gives you instant notification of errors and
exceptions in your website's JavaScript code.

Bugsnag's JavaScript notifier is incredibly small, and has no external
dependencies (not even jQuery!), and works in all mobile browsers, so you can
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

Browser Support
---------------

Bugsnag can automatically notify you of unhandled exceptions in all versions of
all browsers (yes, even IE 6!). Some browsers let us do even more, and
internally we have 3 tiers of higher quality support:

           | Tier A | Tier B | Tier C | Supported
-----------|--------|--------|--------|------------
iOS:       | 7+     | 6      | 3-5    | all
Android:   | 4.0+   |        | 2.2-3  | all
Blackberry |        | 10     |        | all
IE:        | 8+     |        |        | all
Firefox:   | 17+    | 6-16   | 3-5    | all
Safari:    | 7+     | 6      | 5      | all
Chrome:    | 14+    |        |        | all
Opera:     | 13+    | 10-12  |        | all
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

###metaData

Set additional meta-data to send to Bugsnag with every error. You can use this
to add custom tabs of data to each error on your Bugsnag dashboard.

This function should return an object of objects, the outer object should
represent the "tabs" to display on your Bugsnag dashboard, and the inner
objects should be the values to display on each tab, for example:

```javascript
Bugsnag.metaData = {
  user: {
    name: "James",
    email: "james@example.com"
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


###beforeNotify

To have more fine grained control over what errors are sent to Bugsnag, you can 
implement a `beforeNotify` function. If you want to halt the notification completely,
return `false` from this function. You can also add metaData by editing the `metaData`
parameter.

```javascript
Bugsnag.beforeNotify = function(error, metaData) {
  // Example: Only notify Bugsnag of errors in `app.js` or `vendor.js` files
  var match = error.file.match(/app\.js|vendor\.js/i);
  return !!(match && match[0].length > 0);
}
```

The error parameter contains name, message, file and lineNumber fields that contain
information about the error that is being notified.

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
// window.Bugsnag now is bound to what is was before the bugsnag script was
added to the DOM
myBugsnag.apiKey = "my-special-api-key";
try {
  // highly volatile code
} catch (e) {
  myBugsnag.notifyException(e, "OhNoes");
}
```


Advanced hosting
----------------

We will occasionally update bugsnag-2.js on the CDN to improve the quality of
our notifier without breaking backward compatibility. If you need assurance
that the javascript will never change, feel free to include the specific version
directly.

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.1.0.min.js"
        data-apikey="YOUR-API-KEY-HERE"></script>
```

If you have specific requirements for Javascript, you're welcome to host
versions of bugsnag-js on your own site or CDN. You can either download the
file and mirror it, or you can include it in your existing Javascript asset
compilation.

If you're doing this, please ensure that Bugsnag is included before you run
your onload handlers. This is so that we can report stacktraces reliably.

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
