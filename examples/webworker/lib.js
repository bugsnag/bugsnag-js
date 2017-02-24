let workerId = 0;

class WrappedWorker {
  constructor(url) {
    // If we allocate each worker it's own id we can track which messages were sent to & from each worker
    // (if we have multiple workers on the page).
    this.id = ++workerId;
    this.url = url;
    this.worker = new Worker(url);
    this.init();
  }

  init() {
    const handleMessage = event => {
      switch(event.data.type) {
        case "error": {
          // Handle any errors which are passed to us from the worker itself.
          this.notifyException_(event.data.error);
          break;
        }
        case "terminate": {
          // If your worker sends a "terminate" command then we get a breadcrumb entry. If not and the
          // worker calls `close` on itself, we don't, and it may be hard to figure out whether it was
          // still running later.
          this.terminate();
          break;
        }
        default: {
          // Here we're adding a breadcrumb whenever we receive a message *from* the worker - this could
          // help diagnose how far your worker got through it's allocated task (if your worker posts
          // progress events).
          this.leaveBreadcrumb_("Message from worker", event.data);
          break;
        }
      }
    };

    const handleError = event => {
      // Some errors will pass an error message, line/col number, and the filename where the error
      // occured. In some cases this is enough to put together a relatively useful stacktrace.
      function fakeStacktrace() {
        return "Error: " + event.message + "\n" +
          "    at " + event.filename + ":" + event.lineno + ":" + (event.colno || 0);
      }

      // Handle any errors which occur out of our control. For instance; a syntax error.
      // The only downside to this error handler is that the error doesn't contain the stack trace.
      this.notifyException_({
        message: event.message,
        stack: event.lineno ? fakeStacktrace() : undefined,
      });
    };

    this.worker.addEventListener("message", handleMessage);
    this.worker.addEventListener("error", handleError);
  }

  // By default these errors will have the name of "Error", but to help differenciate them from errors
  // which have occured within the main window, we can give it a special name. This also helps when finding
  // it later in your Bugsnag dashboard.
  notifyException_(error) {
    Bugsnag.notifyException(error, "WorkerError", {
      // Let's also pass some information about this worker along with the error report.
      // This information will show up under a tab labelled "worker" in your Bugsnag dashboard!
      worker: {
        id: this.id,
        url: this.url,
      },
    });
  }

  // Make it easy to leave breadcrumbs associated with this worker. The Bugsnag notifier gives us the
  // ability to change how the breadcrumb looks when you see it in the dashboard. Here we're changing
  // the icon to "process". We're also passing along the worker id for added clarity.
  leaveBreadcrumb_(name, metaData) {
    Bugsnag.leaveBreadcrumb({
      type: "process",
      name: name,
      metaData: Object.assign({
        id: this.id,
      }, metaData),
    });
  }

  postMessage(message) {
    // Leave a breadcrumb when we post a message *to* the worker.
    this.leaveBreadcrumb_("Message to worker", message);
    this.worker.postMessage(message);
  }

  terminate() {
    this.leaveBreadcrumb_("Terminated worker");
    this.worker.terminate();

    // This example doesn't clean up after itself, but you would probably want to remove the event
    // handlers which were registered earlier. Just imagine we're doing that here :)
  }

  // Etc... addEventListener...
}
