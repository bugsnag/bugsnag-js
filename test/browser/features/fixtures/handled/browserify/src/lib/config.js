
var ENDPOINT = decodeURIComponent(window.location.search.match(/ENDPOINT=([^&]+)/)[1])
var API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)[1])

exports.apiKey = API_KEY
exports.endpoint = ENDPOINT