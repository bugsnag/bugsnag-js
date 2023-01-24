const worker = new Worker('worker-reports-web-worker.js', {type: 'module'})

const handledErrorBtn = document.querySelector('#handledErrorWebWrkr')
const unhandledErrorBtn = document.querySelector('#unhandledErrorWebWrkr')

handledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Handled error in Web Worker')
})

unhandledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Unhandled error in Web Worker')
})