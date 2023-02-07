const handledErrorServWrkr = document.querySelector('#handledErrorServWrkr')
const unhandledErrorServWrkr = document.querySelector('#unhandledErrorServWrkr')

const registerWorker = () => {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported')
    } else {
        navigator.serviceWorker.register('service-worker.js')
        .then( function(registration) {
            console.log('Service Worker registered. Scope is:', registration.scope)

            handledErrorServWrkr.addEventListener('click', (event) => {
                navigator.serviceWorker.ready.then( function(registration) {
                registration.active.postMessage('Handled error in Service Worker')
                  })
            })
            unhandledErrorServWrkr.addEventListener('click', (event) => {
                navigator.serviceWorker.ready.then( function(registration) {
                registration.active.postMessage('Unhandled error in Service Worker')
                  })
            })
        })
    }
}

registerWorker()