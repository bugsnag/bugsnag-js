const worker = new Worker('web-app-reports-web-worker.js')

// Within a web worker, unhandled errors will also bubble up to 
// the script that initialized the worker. Since we are also 
// using BugSnag in the parent script (see `web-app-reports-unandled.html`),
// you may wish to prevent these errors from being reported a second time
// by using `preventDefault()`:

// worker.onerror = function (e) {
//     e.preventDefault()  
// }

const handledErrorBtn = document.querySelector('#handledErrorWebWrkr')
const unhandledErrorBtn = document.querySelector('#unhandledErrorWebWrkr')

handledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Handled error in Web Worker')
})

unhandledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Unhandled error in Web Worker')
})