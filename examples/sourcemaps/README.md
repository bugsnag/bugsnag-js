# Bugsnag: Plain JS Example, with sourcemaps

This example shows how you can use the Bugsnag JavaScript notifier in a basic
JavaScript environment where minified JavaScript is used.

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)!
You'll be able to see how the errors are reported in the dashboard, how breadcrumbs
are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder
API token with your own!

1. Clone the repo and `cd` into this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd bugsnag-js/examples/sourcemaps
    ```

1. Replace the `API_KEY` placeholder in [index.html](index.html) with your own Bugsnag API key.

1. Install the dependencies (with either npm or yarn):
    ```sh
    npm i
    ```
    ```sh
     yarn
    ```

1. Minify the JavaScript and start a web server:
    ```sh
    npm start
    ```
1. The example page will (most likely) be served at: http://localhost:5000 _BUT!_ see the next step…

1. Bugsnag will need to be able to fetch the sourcemaps by accessing the URL from the outside world so "localhost" won't cut it!  You have the options of uploading your source maps to Bugsnag, or self-hosting.

#### Upload to Bugsnag

Read [our docs](https://docs.bugsnag.com/api/js-source-map-upload/) for full details, but the below will get you started for your example app's source maps.

Add your details to the curl request below and send to Bugsnag:

```sh
curl https://upload.bugsnag.com/ \
    -F apiKey=YOUR_API_KEY \
    -F appVersion=1.2.3 \
    -F minifiedUrl=http://localhost:5000/app.min.js \
    -F sourceMap=@/YOUR_PATH/to/app.min.js.map \
    -F minifiedFile=@/YOUR_PATH/to/app.min.js \
    -F overwrite=true
```

*Note that we also have an [upload tool](https://docs.bugsnag.com/platforms/browsers/js/source-maps/#upload-tool) to make frequent uploading easier.*

#### Self-host

Use something like [localtunnel](https://localtunnel.github.io/www/) or [ngrok](https://ngrok.com/) to expose your local port to the world, then be sure to host the example app on that URL (e.g. if you used localtunnel it would be something like https://zriinngpfy.localtunnel.me)

*Please note that errors that were received before the source maps are uploaded will not be retrospectively de-obfuscated.*


For more options, be sure to check out our documentation for the [Javascript notifier](https://docs.bugsnag.com/platforms/browsers/js/)  and using [source maps](https://docs.bugsnag.com/platforms/browsers/js/source-maps/) with Bugsnag.
