importScripts("/node_modules/@bugsnag/web-worker/dist/bugsnag.web-worker.min.js")

onmessage = function (e) {
    var payload = e.data.payload

    switch (e.data.type) {
        case 'bugsnag-start':
            Bugsnag.start({
                apiKey: payload.API_KEY,
                autoTrackSessions: true,
                endpoints: {
                    notify: payload.NOTIFY,
                    sessions: payload.SESSIONS
                }
            })
            break;
        default:
    } 
}
