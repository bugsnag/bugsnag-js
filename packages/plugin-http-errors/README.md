# @bugsnag/plugin-http-errors

A [@bugsnag/js](https://github.com/bugsnag/bugsnag-js) plugin for HTTP error handling.

## Installation

```sh
npm install --save @bugsnag/plugin-http-errors
# or
yarn add @bugsnag/plugin-http-errors
```

## Usage

```js
import Bugsnag from '@bugsnag/js'
import createHttpErrorPlugin from '@bugsnag/plugin-http-errors'

const plugin = createHttpErrorPlugin({
  httpErrorCodes: [401, { min: 404, max: 499 }], // handle individual error codes or ranges of error codes 
  maxRequestSize: 5_000, // don't capture requests over 5kb
  maxResponseSize: 20_000, // don't capture responses over 20kb
  onHttpError: ({ request, response }) => {
    // Only handle 5xx errors
    if (response.status < 500 || response.status > 599) return false

    // Exclude specific domains
    if (request.url.indexOf('redacted.domain.com') === 0) return false

    // Update properties on the reported request and response
    request.url = '[REDACTED]'
    response.status = 418

    return true // return value will determine whether the error is reported
  }
})

Bugsnag.start({
  apiKey: 'YOUR_API_KEY',
  plugins: [plugin]
})
```

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
