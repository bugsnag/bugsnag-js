# Web Worker Example

This example shows how you can use the Bugsnag JavaScript notifier with Web Workers.

## Demonstrates

- Handle uncaught Web Worker errors
  - [Catching the errors](worker.js#L1-L19)
  - [An example error](worker.js#L44)
  - [Handling the errors & sending them to Bugsnag](lib.js#L16-L20)
- [Handle network/syntax errors](lib.js#L38-L52)
- [Logging breadcrumbs](lib.js#L76-L87)
  - [Started worker](lib.js#L57-L59)
  - [Message to worker](lib.js#L89-L93)
  - [Message from worker](lib.js#L28-L34)
  - [Terminated worker](lib.js#L96)
    - [From main window](app.js#L8)
    - [From within worker](lib.js#L21-L27)
  - [Keeping track of multiple workers](lib.js#L83-L85)
- [Adding custom tab to error report](lib.js#L67-L72)

## Setup

If you want to try out this example in your browser just remember to open up your dev tools.
The example doesn't provide any UI, it simply sends a couple of errors to Bugsnag including some sample breadcrumbs.

This example also doesn't make use of any module bundler, or any build system. The only thing this example focuses on
are the Web Workers themself. These techniques will work regardless of any build system you use in your actual app.

1. Clone the repository

  ```
  $ git clone https://github.com/bugsnag/bugsnag-js.git
  ```

2. Add your project API key

  Open the `index.html` file and replace `API-KEY-GOES-HERE` with your own API key.

  ```html
  <script
    src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js"
    data-apikey="API-KEY-GOES-HERE">
  </script>
  ```

3. Open the example in your browser

  You can do this one of two ways;

  With `http-server`

  ```
  $ npm install -g http-server
  $ http-server examples/webworker
  ```

  or by dragging the `examples/webworker` folder into your browser

4. Open your dev tools

5. Check out your Bugsnag dashboard