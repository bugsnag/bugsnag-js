import Bugsnag from "/node_modules/@bugsnag/worker/dist/notifier.js"

onmessage = (e) => {
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
            console.log(action)
    } 
}
