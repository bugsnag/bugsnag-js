var Bugsnag = require('@bugsnag/browser')
var config = require('./lib/config')
var Vue = require('vue/dist/vue.common.js')

Bugsnag.start(config)

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  },
  methods: {
    errr: function () {
      throw new Error('borked')
    }
  }
})
