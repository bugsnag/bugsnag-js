const worker = new WrappedWorker("./worker.js");

// Send the "start" command to the worker for it to begin it's task.
worker.postMessage({ type: "start" });

// After two seconds, terminate the worker.
setTimeout(() => {
  worker.terminate();
}, 2000);

// Shortly after, let's pretend another error happens in your app. The error will contain
// breadcrumbs about the worker.
setTimeout(() => {
  throw new Error("Something else happens...");
}, 2500);