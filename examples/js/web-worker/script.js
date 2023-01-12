// Bugsnag.start('YOUR_API_KEY')

const worker = new Worker('worker.js', {type: 'module'})

// Within a web worker, unhandled errors will also bubble up to 
// the script that initialized the worker, so if you are also 
// using BugSnag in the parent script (here), you may wish to prevent 
// these errors from being reported a second time:

worker.onerror = function (e) {
    e.preventDefault()
}

const handledErrorBtn = document.querySelector('#handledError')
const unhandledErrorBtn = document.querySelector('#unhandledError')

handledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Test handled error')
})

unhandledErrorBtn.addEventListener('click', (event) => {
    worker.postMessage('Test unhandled error')
})