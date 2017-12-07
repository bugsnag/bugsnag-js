# Bugsnag: Plain JS Example, with sourcemaps

This example shows how you can use the Bugsnag JavaScript notifier in a basic
JavaScript environment where minified JavaScript is used.

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)!
You'll be able to see how the errors are reported in the dashboard, how breadcrumbs
are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder
API token with your own!

1. Clone the repo and `cd` this this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd bugsnag-js/examples/sourcemaps
    ```
1. Install the dependencies (with either npm or yarn):
    ```sh
    npm i
    ```
    ```sh
    yarn
    ```
1. Replace the `API_KEY` placeholder in [index.html](index.html) with your actual API key.
1. Minify the JavaScript and start a web server:
    ```sh
    npm start
    ```
1. The example page which will (most likely) be served at: http://localhost:5000 _BUT!_ see the next step…
1. Bugsnag will need to be able to fetch the sourcemaps by accessing the URL from the outside world so "localhost" won't cut it! Use something like [localtunnel](https://localtunnel.github.io/www/) or [ngrok](https://ngrok.com/) to expose your local port to the world, then be sure to access the example on that URL (e.g. if you used localtunnel it would be something like https://zriinngpfy.localtunnel.me)
