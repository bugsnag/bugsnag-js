# Bugsnag: Vue.js Example

This example shows how you can use the Bugsnag JavaScript notifier with
[Vue.js](https://vuejs.org/).

Whilst the notifier reports any errors that are uncaught, there are certain types
of error specific to Vue.js that get swallowed by its own error handler. The example
shown here illustrates how to use the `Vue.config.errorHandler` setting to report
Vue.js-specific errors to Bugsnag.

## tl;dr

The most basic way to hook up Vue.js -> Bugsnag is as follows:

```js
Vue.config.errorHandler = function () {
  Bugsnag.notifyException(err)
  console.error(err)
}
```

Check out the [detailed example](index.html) for how to provide extra debugging info,
such as the lifecycle phase and component name that caused the error.

## In this example

- [Setting up the error handler](index.html#L43-L56)

  The most basic implementation (above) can be supplemented by providing some other
  information which may come in handy when tracking down the source of the error.
  The example extracts the following information, if available:
    - the offending component name (or `'app root'`)
    - the `propsData` it was passed
    - the `info` string passed to the error handler, which can include what
    [lifecycle phase](https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram)
    the error originated in

  There may be other properties of the `vm` object passed to the error handler that
  you are interested in – you can tweak the example to your needs and it will show
  in the "custom" tab when viewing event details in your dashboard.

- [Handling render errors](index.html#L20-L23)

  Errors thrown during the render() of the root node are caught and reported.

- [Handling render errors (child components)](index.html#L33-39)

  Errors thrown during the render() of any child components caught and reported,
  with the name of the component and any `propsData`.

- [Handling digest errors, e.g. `Vue.nextTick(fn)`](index.html#L100-L105)

  Errors thrown from the global [async update queue](https://vuejs.org/v2/guide/reactivity.html#Async-Update-Queue)
  are caught via the same error handler. If the error originates from a global
  callback and not a component (such as in the example provided), you don't get
  any component info.

- [Handling watch/computed property errors](index.html#L83-L89)

  Errors thrown during `watch`/`computed` methods are caught and reported.

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)!
You'll be able to see how the errors are reported in the dashboard, how breadcrumbs
are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder
API token with your own!

1. Clone the repo and `cd` this this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd examples/vue
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
1. View the example page which will (most likely) be served at: http://localhost:5000/examples/vue
