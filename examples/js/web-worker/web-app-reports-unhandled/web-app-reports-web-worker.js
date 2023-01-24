import Bugsnag from '/node_modules/@bugsnag/web-worker/dist/notifier.js'
Bugsnag.start({
    apiKey: 'YOUR_API_KEY',
    autoDetectErrors: true,
    autoTrackSessions: true
  })

onmessage = function(message) {
    if(message.data === 'Handled error in Web Worker') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from `web-app-reports-web-worker.js`')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    }
    
    else if (message.data === 'Unhandled error in Web Worker') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from `web-app-reports-web-worker.js`')
        console.log(message)
        throw new Error(message.data)
    }
}
