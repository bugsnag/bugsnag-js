import Bugsnag from '/node_modules/@bugsnag/web-worker/dist/notifier.js'
Bugsnag.start('ed0820ec954fcc35c3bc4f18fd36b206')

addEventListener('message', (message) => {
    if (message.data === 'Handled error in Service Worker') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from Service Worker')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    } 
    
    else if (message.data === 'Unhandled error in Service Worker') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from Service Worker')
        console.log(message)
        throw new Error(message.data)
    }
})