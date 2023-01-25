importScripts("/node_modules/@bugsnag/web-worker/dist/bugsnag.web-worker.min.js")

onmessage = function (e) {
    const { type, payload } = e.data
    switch (type) {
        case 'bugsnag-start':
            Bugsnag.start({
                apiKey: payload.API_KEY,
                endpoints: {
                    notify: payload.NOTIFY,
                    sessions: payload.SESSIONS
                }
            })
            postMessage('bugsnag-ready')
            break;
        case 'bugsnag-notify':
            Bugsnag.notify(new Error('I am an error'))
            break;
        default:
    } 
}
