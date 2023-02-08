const handledErrorServWrkr = document.querySelector('#handledErrorServWrkr')
const unhandledErrorServWrkr = document.querySelector('#unhandledErrorServWrkr')
const unregisterBtn = document.querySelector('#unregister')

const registerWorker = () => {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported')
    } else {
        navigator.serviceWorker.register('service-worker.js')
        .then((registration) => {
            console.log('Service Worker registered. Scope is:', registration.scope)

            handledErrorServWrkr.addEventListener('click', () => {
                navigator.serviceWorker.ready.then((registration) => {
                registration.active.postMessage('Handled error in service-worker.js')
                  })
            })
            unhandledErrorServWrkr.addEventListener('click', () => {
                navigator.serviceWorker.ready.then((registration) => {
                registration.active.postMessage('Unhandled error in service-worker.js')
                  })
            })
            unregisterBtn.addEventListener('click', () => {
                unregisterWorker()
            })
        })
    }
}

const unregisterWorker = () => {
    if('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
            for(let registration of registrations) { 
                registration.unregister()
            }
        })
    }
}

registerWorker()