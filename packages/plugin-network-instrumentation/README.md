# @bugsnag/plugin-network-instrumentation

A [@bugsnag/js](https://github.com/bugsnag/bugsnag-js) plugin for HTTP error handling.

## Installation

```sh
npm install --save @bugsnag/plugin-network-instrumentation
# or
yarn add @bugsnag/plugin-network-instrumentation
```

## Usage

```js
import Bugsnag from '@bugsnag/js'
import BugsnagPluginNetworkRequests from '@bugsnag/plugin-network-instrumentation'

Bugsnag.start({
  apiKey: 'YOUR_API_KEY_HERE',
  plugins: [BugsnagPluginNetworkInstrumentation({
    httpErrorCodes = [400, 401, { min: 450: max 499 }], // Status codes to report as errors
    maxRequestSize = 20_000,                            // Truncate the request body over this size (in bytes) defaults to 0 (nothing is captured)
    maxResponseSize = 20_000,                           // Truncate the response body over this size (in bytes) defaults to 0 (nothing is captured)
    onHttpError: ({ request, response }) => {
      request.headers['x-custom-header'] = 'value'      // Modify any request values before sending
      response.body = 'custom body'                     // Modify any response values before sending

      return false                                      // Don't report this request an as error
    }
  })]
})
```

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
