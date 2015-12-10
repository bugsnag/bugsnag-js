Contributing
============

-   [Fork](https://help.github.com/articles/fork-a-repo) the [notifier on github](https://github.com/bugsnag/bugsnag-js)
-   Build and test your changes
-   Commit and push until you are happy with your contribution
-   [Make a pull request](https://help.github.com/articles/using-pull-requests)
-   Thanks!

Testing
=======

Running the tests requires [Grunt CLI](https://github.com/gruntjs/grunt-cli). It
is available via [npm](https://npmjs.org):

```
npm install grunt-cli
```

Also install the dependencies for the project:

```
npm install
```

### In browser

```
grunt browsertest
```

Any large changes should be tested in old IEs (we support IE 6!), and any other
browsers you can get your hands on. The easiest way
to get these is from [modern.ie](https://www.modern.ie/en-gb/virtualization-tools#downloads).

### Headless (Using PhantomJS)

```
grunt test
```

Releasing
=========

- Ensure you have the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
  environment variables set.
- Bump the version number

    grunt bump::{major,minor,patch}

- Update the CHANGELOG, and README if necessary
- Commit, tag, build, upload to S3, invalidate cloudfront, push to github:

    grunt release

- Wait for cloudfront to invalidate the symlink
- Test that exception reporting still works on [Bugsnag](https://bugsnag.com)

