importScripts('//d2wy8f7a9ursnm.cloudfront.net/v7/bugsnag.web-worker.min.js')

Bugsnag.start({
    apiKey: 'YOUR_API_KEY',
    autoDetectErrors: true,
    autoTrackSessions: false
  })

self.addEventListener('message', (message) => {
    if (message.data === 'Handled error in service-worker.js') {
        Bugsnag.leaveBreadcrumb('Handled error breadcrumb from service-worker.js')
        console.log(message)
        Bugsnag.notify(new Error(message.data))
    } 
    
    else if (message.data === 'Unhandled error in service-worker.js') {
        Bugsnag.leaveBreadcrumb('Unhandled error breadcrumb from service-worker.js')
        console.log(message)
        throw new Error(message.data)
    }
})