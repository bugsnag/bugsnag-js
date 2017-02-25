// Simple global error handler which posts worker error details back to the main window.
self.addEventListener("error", event => {
  // This line is really important, it prevents the Worker object (in the main window) from
  // receiving an `error` event. Sounds crazy, but the `error` event doesn't contain the
  // stacktrace. By sending the event ourselves, we get the chance to send everything.
  event.preventDefault();
  console.error(event.error);

  self.postMessage({
    type: "error",

    // Because the error object is not clonable, we must construct an error-like object and
    // pass through the error message & stack (the notifier doesn't know the difference).
    error: {
      message: event.error.message,
      stack: event.error.stack,
    },
  });
});

// Example of what your worker may look like - delegates any messages from the main window
// containing the "start" signal to the `startLongRunningTask` function (below).
self.addEventListener("message", function messageHandler(event) {
  switch(event.data.type) {
    case "start": {
      startLongRunningTask();
      break;
    }
    default: {
      console.warn("Unknown message:", event.data);
      break;
    }
  }
});

// Simulates some kind of "long" running task which is usually only performed within a worker
// to prevent jank in the main window. We're just calling `loop` a few times to grow the stack.
function startLongRunningTask() {
  // We should see this message displayed in our breadcrumbs!
  self.postMessage({ type: "started" });

  (function loop(count) {
    if (count === 3) {
      throw new Error("Oh no, something bad happened!");
    } else {
      loop(count + 1);
    }
  })(0);

  // This never runs (because the code above throws synchronously).
  self.postMessage({ type: "complete" });
}