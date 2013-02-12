Bugsnag Notifier for JavaScript
===============================

The Bugsnag Notifier for JavaScript gives you instant notification of errors and
exceptions in your website's JavaScript code.

Bugsnag's JavaScript notifier is incredibly small, and has no external
dependencies (not even jQuery!) so you can use it on any website.

[Bugsnag](https://bugsnag.com) captures errors in real-time from your web,
mobile and desktop applications, helping you to understand and resolve them
as fast as possible. [Create a free account](https://bugsnag.com) to start
capturing errors from your applications.


How to Install
--------------

Include `bugsnag.js` from our CDN in the `<head>` tag of your website, before
any other `<script>` tags.

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-1.0.4.min.js" data-apikey="YOUR-API-KEY-HERE"></script>
```

Make sure to set your Bugsnag API key in the `data-apikey` attribute on the
script tag, or manually set [Bugnsag.apiKey](#apiKey).


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


Limitations
-----------

Some browsers, notably IE9 and below, don't support stacktraces on exceptions.
In these situations we'll attempt to construct an approximate stacktrace,
which will unfortunately not contain URL or line number information.


Additional Configuration
------------------------

###apiKey

Set your Bugsnag API key. You can find your API key on your dashboard.

```javascript
Bugsnag.apiKey = "YOUR-API-KEY-HERE";
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


Reporting Bugs or Feature Requests
----------------------------------

Please report any bugs or feature requests on the github issues page for this
project here:

<https://github.com/bugsnag/bugsnag-js/issues>


Contributing
------------

-   [Fork](https://help.github.com/articles/fork-a-repo) the [notifier on github](https://github.com/bugsnag/bugsnag-js)
-   Commit and push until you are happy with your contribution
-   [Make a pull request](https://help.github.com/articles/using-pull-requests)
-   Thanks!


License
-------

The Bugsnag JavaScript notifier is free software released under the MIT License.
See [LICENSE.txt](https://github.com/bugsnag/bugsnag-js/blob/master/LICENSE.txt) for details.
