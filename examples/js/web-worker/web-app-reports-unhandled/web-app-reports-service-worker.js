import Bugsnag from '/node_modules/@bugsnag/web-worker/dist/notifier.js'
Bugsnag.start('YOUR_API_KEY')

addEventListener('message', (message) => {
    if (message.data === 'Handled error in Service Worker') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from `web-app-reports-service-worker.js`')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    } 
    
    else if (message.data === 'Unhandled error in Service Worker') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from `web-app-reports-service-worker.js`')
        console.log(message)
        throw new Error(message.data)
    }
})
