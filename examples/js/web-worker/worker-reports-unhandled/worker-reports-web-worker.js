importScripts('//d2wy8f7a9ursnm.cloudfront.net/v7/bugsnag.web-worker.min.js')

Bugsnag.start('ed0820ec954fcc35c3bc4f18fd36b206')

onmessage = function(message) {
    if(message.data === 'Handled error in Web Worker') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from `worker-reports-web-worker.js`')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    }
    
    else if (message.data === 'Unhandled error in Web Worker') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from `worker-reports-web-worker.js`')
        console.log(message)
        throw new Error(message.data)
    }
}
