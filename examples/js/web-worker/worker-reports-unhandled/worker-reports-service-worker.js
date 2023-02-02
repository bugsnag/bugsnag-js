importScripts('//d2wy8f7a9ursnm.cloudfront.net/v7/bugsnag.web-worker.min.js')

Bugsnag.start('ed0820ec954fcc35c3bc4f18fd36b206')

addEventListener('message', (message) => {
    if (message.data === 'Handled error in Service Worker') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from `worker-reports-service-worker.js`')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    } 
    
    else if (message.data === 'Unhandled error in Service Worker') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from `worker-reports-service-worker.js`')
        console.log(message)
        throw new Error(message.data)
    }
})
