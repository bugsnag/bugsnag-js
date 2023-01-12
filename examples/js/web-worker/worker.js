import Bugsnag from "/node_modules/@bugsnag/web-worker/dist/notifier.js"

Bugsnag.start('YOUR_API_KEY')

onmessage = function(message) {
    if(message.data === 'Test handled error') {
        Bugsnag.leaveBreadcrumb('Test handled error breadcrumb')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    }
    
    else if (message.data === 'Test unhandled error') {
        Bugsnag.leaveBreadcrumb('Test unhandled error breadcrumb')
        console.log(message)
        throw new Error(message.data)
    }
}