let workerId = 0;

class WrappedWorker {
  constructor(url) {
    this.id = ++workerId;
    this.worker = new Worker(url);
    this.init();
  }

  init() {
    const handleMessage = event => {
      switch(event.data.type) {
        case "error":
          Bugsnag.notifyException(event.data.error, "WorkerError");
          break;
        default:
          this.leaveBreadcrumb_("Message from worker", {
            message: JSON.stringify(event.data, null, '  '),
          });
          break;
      }
    };

    this.worker.addEventListener("message", handleMessage);
  }

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
    this.leaveBreadcrumb_("Message to worker", {
      message: JSON.stringify(message, null, '  '),
    });
    this.worker.postMessage(message);
  }

  terminate() {
    this.leaveBreadcrumb_("Terminated worker");
    this.worker.terminate();
  }
}

const worker = new WrappedWorker("./worker.js");
worker.postMessage({ type: "start" });

setTimeout(() => {
  worker.terminate();
}, 1000);

setTimeout(() => {
  throw new Error("Something else happens...");
}, 1500);