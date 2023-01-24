import Bugsnag from '/node_modules/@bugsnag/web-worker/dist/notifier.js'
Bugsnag.start({
    apiKey: 'ed0820ec954fcc35c3bc4f18fd36b206',
    autoDetectErrors: true,
    autoTrackSessions: true
  })

onmessage = function(message) {
    if(message.data === 'Handled error in Web Worker') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from Web Worker')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    }
    
    else if (message.data === 'Unhandled error in Web Worker') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from Web Worker')
        console.log(message)
        throw new Error(message.data)
    }
}