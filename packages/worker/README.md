# @bugsnag/worker

This package contains the web worker / service worker implementation of the Bugsnag notifier for JavaScript.

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.

## Basic usage

```js
// worker.js
import Bugsnag from "/node_modules/@bugsnag/worker/dist/notifier.js"

Bugsnag.start({
    apiKey: YOUR_API_KEY
})

function myFunction() {
    try {
        // something that will throw an error
    } catch (err) {
        Bugsnag.notify(new Error(err))
    }
}
```
