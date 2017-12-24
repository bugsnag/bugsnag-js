# Bugsnag: TypeScript Example

This example shows how you can use the Bugsnag JavaScript notifier in a Typescript environment.

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)!
You'll be able to see how the errors are reported in the dashboard, how breadcrumbs
are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder
API token with your own!

1. Clone the repo and `cd` into this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd bugsnag-js
    ```
1. Install the notifier dependencies:
    ```sh
    npm i
    ```
1. Build the notifier:
    ```sh
    npm run build
    ```
1. cd into the example directory:
    ```sh
    cd examples/js
    ```
1. Replace the `API_KEY` placeholder in [app.ts](app.ts) with your actual API key.
1. Install the app dependencies:
    ```sh
    npm i
    ```
1. Compile the typescript and start a web server:
    ```sh
    npm start
    ```
1. View the example page which will (most likely) be served at: http://localhost:5000


For more information, see our documentation:
https://docs.bugsnag.com/platforms/browsers/js/
