# @bugsnag/plugin-azure-functions

A [@bugsnag/js](https://github.com/bugsnag/bugsnag-js) plugin for capturing errors in Azure Functions.

# Install

````
yarn add @bugsnag/plugin-azure-functions
# or
npm install --save @bugsnag/plugin-azure-functions
````

# Usage

To start Bugsnag with the Azure Functions integration, pass the plugin to Bugsnag.start:

````
const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAzureFunctions = require('@bugsnag/plugin-azure-functions')

Bugsnag.start({
  plugins: [BugsnagPluginAzureFunctions],
})
````

Start handling errors in your Azure function by wrapping your handler with Bugsnag’s handler:

````
const bugsnagHandler = Bugsnag.getPlugin('azureFunctions').createHandler()

const handler = async (context, req) => {
  return {
    status: 200,
    body: JSON.stringify({ message: 'Hello, World!' })
  }
}

module.exports = bugsnagHandler(handler)
````

# Automatically captured data

Bugsnag will automatically capture the Azure function's `context` in the "Azure Functions context" tab on every error.

# Configuration

The Bugsnag Azure Functions plugin can be configured by passing options to createHandler.

**flushTimeoutMs**

Bugsnag will wait for events and sessions to be delivered before allowing the Azure function to exit. This option can be used to control the maximum amount of time to wait before timing out.

By default, Bugsnag will timeout after 2000 milliseconds.

````
const bugsnagHandler = Bugsnag.getPlugin('azureFunctions').createHandler({
  flushTimeoutMs: 5000
})
````

If a timeout does occur, Bugsnag will log a warning and events & sessions may not be delivered.

## License

This package is free software released under the MIT License.