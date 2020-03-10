var Vue = require('vue/dist/vue.common.js')
var BugsnagVuePlugin = require('@bugsnag/plugin-vue')

var ENDPOINT = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])
var API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])

exports.apiKey = API_KEY
exports.endpoints = { notify: ENDPOINT, sessions: '/noop' }
exports.plugins = [new BugsnagVuePlugin(Vue)]
