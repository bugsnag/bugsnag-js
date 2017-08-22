# Bugsnag: React Example

This example shows how you can use the Bugsnag JavaScript notifier with
[React](https://facebook.github.io/react/), specifically taking advantage of
[improved error handling](https://facebook.github.io/react/blog/2017/07/26/error-handling-in-react-16.html)
in version 16.

_N.B. React 16 is in public beta and this example will not work with the current "stable" release of React (v15). Track the progress of the v16 beta release [here](https://github.com/facebook/react/issues/10294)._

Whilst the notifier reports any errors that are uncaught, there are certain types
of error that can happen in React which can either be swallowed, or thrown with
limited contextual info. The addition of "error boundaries" in React 16 allow
you to define how components respond to error states in within the component tree.

## tl;dr

The most basic way to hook up React -> Bugsnag is to simply include the Bugsnag
js notifier in the `<head>` of your page that hosts your React app. If you don't
define any error boundaries in your component tree, React allows errors to bubble
out to the global handlers which Bugnsag hooks in to. However, to include more
context to your reported exceptions, see the detailed example included here.

## In this example

- [Setting up an error boundary](index.html#L56-L64)

  Error boundaries are React components that have a `componentDidCatch` method.
  Defining a `componentDidCatch` method on any component makes it an error boundary,
  which means that errors occurring during the lifecycle of any of its child components
  will be caught and handled by this function.

  `componentDidCatch` takes two arguments, `error` – the `Error` object that was
  caught, and `info` – an object providing context. The `info` object is exactly
  the kind of thing that will help provide some context to the error once its reported
  to Bugnsag. Passing this object in as per the example means it will show in the
  "React" tab when viewing event details in your dashboard.

- [Handling an error during render()](index.html#L45-L49)

  Accessing a property of something that is `undefined` is one way to cause an error
  during the render of the component tree. This example is a child of the error
  boundary component, so the error is caught and reported.

  _Note that React in development mode will also rethrow this error (so that "Pause
  on uncaught exceptions" in devtools still works). This results in duplicate reported
  exceptions, but then in real-life you wouldn't want to be notifying Bugsnag of
  errors in development anyway!_

- [Handling a thrown error from an event handler](index.html#L42)

  Errors thrown during `onClick` (and other user initiated events) handlers are
  not handled by event boundaries, and are thrown, caught and reported by the
  auto notify behaviour of the notifier.

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)!
You'll be able to see how the errors are reported in the dashboard, how breadcrumbs
are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder
API token with your own!

1. Clone the repo and `cd` this this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd examples/react
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
1. View the example page which will (most likely) be served at: http://localhost:5000/examples/react
