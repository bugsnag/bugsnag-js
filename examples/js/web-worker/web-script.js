// const Bugsnag =  require('/node_modules/@bugsnag/js/browser/notifier.js')
// Bugsnag.start('ed0820ec954fcc35c3bc4f18fd36b206')

const worker = new Worker('web-worker.js', {type: 'module'})

// Within a web worker, unhandled errors will also bubble up to 
// the script that initialized the worker, so if you are also 
// using BugSnag in the parent script (here), you may wish to prevent 
// these errors from being reported a second time by using `preventDefault()`:

worker.onerror = function (e) {
    e.preventDefault()  
}

const handledErrorBtn = document.querySelector('#handledErrorWebWrkr')
const unhandledErrorBtn = document.querySelector('#unhandledErrorWebWrkr')

handledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Handled error in Web Worker')
})

unhandledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Unhandled error in Web Worker')
})