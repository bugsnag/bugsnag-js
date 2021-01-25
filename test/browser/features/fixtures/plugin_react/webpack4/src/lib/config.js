var BugsnagReactPlugin = require('@bugsnag/plugin-react')
var React = require('react')

var NOTIFY = decodeURIComponent(window.location.search.match(/NOTIFY=([^&]+)/)[1])
var SESSIONS = decodeURIComponent(window.location.search.match(/SESSIONS=([^&]+)/)[1])
var API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])

exports.apiKey = API_KEY
exports.endpoints = { notify: NOTIFY, sessions: SESSIONS }
exports.plugins = [new BugsnagReactPlugin(React)]
