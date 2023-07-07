importScripts('//d2wy8f7a9ursnm.cloudfront.net/v7/bugsnag.web-worker.min.js')

Bugsnag.start({
    apiKey: 'YOUR_API_KEY',
    autoDetectErrors: true,
    autoTrackSessions: true
  })

self.onmessage = (message) => {
    if(message.data === 'Handled error in worker-no-propagation.js') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from worker-no-propagation.js')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    }
    
    else if (message.data === 'Unhandled error in worker-no-propagation.js') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from worker-no-propagation.js')
        console.log(message)
        throw new Error(message.data)
    }
}
