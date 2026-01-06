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
import BugsnagPluginHttpErrors from '@bugsnag/plugin-http-errors'

Bugsnag.start({
  apiKey: 'YOUR_API_KEY_HERE',
  plugins: [BugsnagPluginHttpErrors({
    httpErrorCodes = [400, 401, { min: 450: max 499 }], // Status codes to report as errors
    maxRequestSize = 20_000,                            // Truncate the request and response body over this size (in kb) 
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
