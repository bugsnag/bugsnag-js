import Bugsnag from '/node_modules/@bugsnag/web-worker/dist/notifier.js'
Bugsnag.start('YOUR_API_KEY')

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
