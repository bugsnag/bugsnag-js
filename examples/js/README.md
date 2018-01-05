# Bugsnag: Plain JS Example

This example shows how you can use the Bugsnag JavaScript notifier in a basic JavaScript environment.

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)! You'll be able to see how the errors are reported in the dashboard, how breadcrumbs are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder API token with your own!

1. Clone the repo and `cd` into this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd bugsnag-js/examples/js
    ```

1. Replace the `API_KEY` placeholder in [index.html](index.html) with your own Bugsnag API key.

1. Install the dependencies (with either npm or yarn):
    ```sh
    npm i
    ```
    ```sh
     yarn
    ```

1. Start a web server:
    ```sh
    npm start
    ```
1. View the example page which will (most likely) be served at: http://localhost:5000

For more information, see our documentation:
https://docs.bugsnag.com/platforms/browsers/js/
