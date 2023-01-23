// const Bugsnag =  require('/node_modules/@bugsnag/js/browser/notifier.js')
// Bugsnag.start('YOUR_API_KEY')

const handledErrorBtn = document.querySelector('#handledErrorServWrkr')
const unhandledErrorBtn = document.querySelector('#unhandledErrorServWrkr')

const registerWorker = () => {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported')
    } else {
        navigator.serviceWorker.register('/service-worker.js', { type: 'module' })
        .then( function(registration) {
            console.log('Service Worker registered. Scope is:', registration.scope)

            handledErrorBtn.addEventListener('click', (event) => {
                // navigator.serviceWorker.ready.then( function(registration) {
                registration.active.postMessage('Handled error in Service Worker')
                //   })
            })
            unhandledErrorBtn.addEventListener('click', (event) => {
                // navigator.serviceWorker.ready.then( function(registration) {
                registration.active.postMessage('Unhandled error in Service Worker')
                //   })
            })
        })
    }
}

registerWorker()
