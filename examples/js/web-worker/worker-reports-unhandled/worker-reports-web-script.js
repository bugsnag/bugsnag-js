const worker = new Worker('worker-reports-web-worker.js')

const handledErrorWebWrkr = document.querySelector('#handledErrorWebWrkr')
const unhandledErrorWebWrkr = document.querySelector('#unhandledErrorWebWrkr')

handledErrorWebWrkr.addEventListener('click', (event) => {
    worker.postMessage('Handled error in Web Worker')
})

unhandledErrorWebWrkr.addEventListener('click', (event) => {
    worker.postMessage('Unhandled error in Web Worker')
})