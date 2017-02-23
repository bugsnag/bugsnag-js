self.addEventListener("error", event => {
  self.postMessage({
    type: "error",
    error: {
      message: event.error.message,
      stack: event.error.stack,
    },
  });
});

self.addEventListener("message", function(event) {
  switch(event.data.type) {
    case "start":
      startLongRunningTask();
      break;
    default:
      console.warn("Unknown message:", event.data);
      break;
  }
});

function startLongRunningTask() {
  (function loop(count) {
    if (count >= 10) {
      throw new Error("Hello World");
    } else {
      loop(count + 1);
    }
  })(0);
}