importScripts('//d2wy8f7a9ursnm.cloudfront.net/v7/bugsnag.web-worker.min.js')

Bugsnag.start({
    apiKey: 'ed0820ec954fcc35c3bc4f18fd36b206',
    autoDetectErrors: false,
    autoTrackSessions: false
  })

onmessage = function(message) {
    if(message.data === 'Handled error in worker-propagation.js') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from worker-propagation.js')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    }
    
    else if (message.data === 'Unhandled error in worker-propagation.js') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from worker-propagation.js')
        console.log(message)
        throw new Error(message.data)
    }
}