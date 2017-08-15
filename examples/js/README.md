# Bugsnag: Plain JS Example

This example shows how you can use the Bugsnag JavaScript notifier in a basic
JavaScript environment.

## In this example

- [Handling uncaught errors](index.html#L27-L31)

  Errors that are thrown (and not caught by your program) are automatically
  sent to Bugsnag.

- [Handling asynchronous uncaught errors](index.html#L33-L39)

  When errors are thrown asynchronously in JavaScript you generally lose information
  about the stack trace (i.e the chain of execution that caused the culprit function
  to be called). Bugsnag leaves "breadcrumbs" – a trail of activity and errors leading
  up the error event – helping to fill in some of the context.

  In this example, in the breadcrumbs tab in the Bugsnag dashboard, you'll see a
  "UI click" event preceding the error.

- [Manually notifying Bugsnag of a caught error](index.html#L41-L51)

  Sometimes you'll anticipate an error in your program, catch it, deal with it
  and move on. You might still be interested in tracking the frequency, prevalence
  or cause of these errors though. In which case, you can use the
  `Bugsnag.notifyException(err)` function.

- [Catching syntax errors](index.html#L55-L57)

  When a `<script>` contains invalid JavaScript syntax, a `window.onerror` event
  happens. The Bugsnag notifier automatically catches and reports them.

  In this example, the `console.log()` expression is missing a bracket, so every
  time you load page a `SyntaxError` will be sent to Bugsnag.

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)!
You'll be able to see how the errors are reported in the dashboard, how breadcrumbs
are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder
API token with your own!

1. Clone the repo and `cd` this this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd examples/js
    ```
1. Install the dependencies (with either npm or yarn):
    ```sh
    npm i
    ```
    ```sh
    yarn
    ```
1. Replace the `API-KEY-GOES-HERE` placeholder in [index.html](index.html) with your actual API key.
1. Start a web server:
    ```sh
    npm start
    ```
1. View the example page which will (most likely) be served at: http://localhost:5000/examples/js
