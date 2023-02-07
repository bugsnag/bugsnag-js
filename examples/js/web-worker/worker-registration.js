const workerPropagation = new Worker('worker-propagation.js')
const workerNoPropagation = new Worker('worker-no-propagation.js')

// Within a web worker, unhandled errors will also bubble up to 
// the script that initialized the worker. Since we are also 
// using BugSnag in the parent script (see `index.html`),
// we are stopping the propagation of unhandled errors
// from `worker-no-propagation.js`, because this worker is
// currently responsible for reporting its own unhandled errors:

workerNoPropagation.onerror = function (e) {
    e.preventDefault()  
}

const handledErrorWebWrkrProp = document.querySelector('#handledErrorWebWrkrProp')
const unhandledErrorWebWrkrProp = document.querySelector('#unhandledErrorWebWrkrProp')
const handledErrorWebWrkrNoProp = document.querySelector('#handledErrorWebWrkrNoProp')
const unhandledErrorWebWrkrNoProp = document.querySelector('#unhandledErrorWebWrkrNoProp')

handledErrorWebWrkrProp.addEventListener('click', (event) => {
    workerPropagation.postMessage('Handled error in worker-propagation.js')
})

unhandledErrorWebWrkrProp.addEventListener('click', (event) => {
    workerPropagation.postMessage('Unhandled error in worker-propagation.js')
})
handledErrorWebWrkrNoProp.addEventListener('click', (event) => {
    workerNoPropagation.postMessage('Handled error in worker-no-propagation.js')
})

unhandledErrorWebWrkrNoProp.addEventListener('click', (event) => {
    workerNoPropagation.postMessage('Unhandled error in worker-no-propagation.js')
})