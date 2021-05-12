const Bugsnag = require('@bugsnag/electron')

Bugsnag.start(window.RunnerAPI.rendererConfig)
