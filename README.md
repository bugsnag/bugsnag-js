Bugsnag Notifier for JavaScript
===============================

The Bugsnag Notifier for JavaScript gives you instant notification of errors and
exceptions in your website's JavaScript code.

[Bugsnag](https://bugsnag.com) captures errors in real-time from your web, 
mobile and desktop applications, helping you to understand and resolve them 
as fast as possible. [Create a free account](https://bugsnag.com) to start 
capturing errors from your applications.


How to Install
--------------

Include bugsnag.js from our CDN in the `<head>` tag of your website:

```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-1.0.1.min.js" data-apikey="YOUR-API-KEY-HERE"></script>
```

Make sure to set your Bugsnag API key in the `data-apikey` attribute on the
script tag.


Sending Custom Errors or Non-Fatal Exceptions
---------------------------------------------

You can easily tell Bugsnag about non-fatal or caught exceptions by 
calling `Bugsnag.notifyException`:

```javascript
Bugsnag.notifyException(new Error("Something bad happened"));
```

You can also send custom errors to Bugsnag with `Bugsnag.notify`:

```javascript
Bugsnag.notify("ErrorType", "Something bad happened here too");
```

Both of these functions can also be passed an optional `metaData` parameter,
which should take the same format as [metaData](#metadata) described below.


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
