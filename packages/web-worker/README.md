# @bugsnag/web-worker

This package contains the web worker / service worker implementation of the BugSnag library.

## Features and limitations

This early release offers basic functionality for web workers and service workers, with the intent to support Chrome extension development using manifest v3. Using this library, you will be able to:

- notify errors from within service workers and web workers, including browser extensions
- detect and automatically notify unhandled errors from service workers and web workers, excluding Chrome browser extensions due to limitations in the Chrome Runtime API.

## Getting tarted

### Installation

```bash
npm i @bugsnag/web-worker
```

### Usage

```js
import Bugsnag from "@bugsnag/web-worker"

Bugsnag.start({
    apiKey: YOUR_API_KEY
})

function myFunction() {
    try {
        // something that will throw an error
    } catch (err) {
        Bugsnag.notify(err)
    }
}
```

For further information check out the [documentation](https://docs.bugsnag.com/platforms/javascript/web-worker/).

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.