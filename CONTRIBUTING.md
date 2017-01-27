Contributing
============

-   [Fork](https://help.github.com/articles/fork-a-repo) the [notifier on github](https://github.com/bugsnag/bugsnag-js)
-   Build and test your changes
-   Commit and push until you are happy with your contribution
-   [Make a pull request](https://help.github.com/articles/using-pull-requests)
-   Thanks!

Testing
=======

Install karma-cli

```
npm install -g karma-cli
```

Install the dependencies for the project:

```
npm install
```

### Linting

We have some basic lint rules set up to catch style issues. Run with:

```
npm run lint
```

### Headless (Using PhantomJS)

```
npm run test:quick
```

### In browser

Any large changes should be tested in old IEs (we support IE 6!), and any other
browsers you can get your hands on.

While it's possible to use npm and karma to run the tests in various browsers
from the command line, the easiest way is typically to open the
`bugsnag-js/test/index.html` file directly from your local file system:

![browser test output](https://cloud.githubusercontent.com/assets/187987/20023457/469fa1f0-a29d-11e6-861c-1c8a5fd9688d.png)

Note that in certain browsers (e.g. Chrome) some tests that fetch local files or
iframes may fail for security reasons when run directly from the file system.

#### Sauce Labs automated browser testing

To do automated browser testing with sauce labs first install sauce-connect

```
brew cask install sauce-connect
```

Then ensure that you have `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` environment
variables set.

Finally run:

```
karma start --single-run
```

This will run automated tests with all browsers in the `browsers.json` file.

To run a subset of browsers, select the ones you want and add them to the
`--browsers` flag of the karma command.

```
karma start --single-run --browsers sl_ie_6, sl_ie_7
```

#### Manual browser testing

If you don't have sauce labs you can do some basic IE testing by using
[modern.ie](https://www.modern.ie/en-gb/virtualization-tools#downloads).

Releasing
=========

1.  Ensure you have the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
    environment variables set.
2.  Bump the version number

    ```
    grunt bump::{major,minor,patch,build}
    ```

3.  Update the CHANGELOG, and README if necessary
4.  Commit, tag, build, upload to S3, invalidate cloudfront, push to github:

    ```
    grunt release
    ```
5.  Create a release on github

### Pre-release version

- Update the [release on GitHub](https://github.com/bugsnag/bugsnag-js/releases)
  to include the release notes and check the "pre-release" checkbox
- Draft the integration guide changes for docs.bugsnag.com
- Update and test bugsnag.com with the new version

### Standard release

- Wait for cloudfront to invalidate the symlink
- Test that exception reporting still works on [Bugsnag](https://bugsnag.com)
- Release the new integration guides for JavaScript on docs.bugsnag.com, and
  find and update all references to `bugsnag-[major version].js`
