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

Any large changes should be tested in old IEs (we support IE 6!), and any other
browsers you can get your hands on.

#### Sauce Labs automated browser testing

To do automated browser testing with sauce labs first install sauce-connect

```
brew cask install sauce-connect
```

Then insure that you have `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` environment
variables set.

Finally run:

```
karma start --single-run
```

#### Manual browser testing

If you don't have sauce labs you can do some basic IE testing by using
[modern.ie](https://www.modern.ie/en-gb/virtualization-tools#downloads).

### Headless (Using PhantomJS)

```
grunt test
```

Releasing
=========

- Ensure you have the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
  environment variables set.
- Bump the version number
```
  grunt bump::{major,minor,patch,build}
```
- Update the CHANGELOG, and README if necessary
- Commit, tag, build, upload to S3, invalidate cloudfront, push to github:
```
  grunt release
```
### Prerelease version

- Update the [release on GitHub](https://github.com/bugsnag/bugsnag-js/releases)
  to include the release notes and check the "pre-release" checkbox
- Draft the integration guide changes for docs.bugsnag.com
- Update and test bugsnag.com with the new version

### Standard release

- Wait for cloudfront to invalidate the symlink
- Test that exception reporting still works on [Bugsnag](https://bugsnag.com)
- Release the new integration guides for JavaScript on docs.bugsnag.com
