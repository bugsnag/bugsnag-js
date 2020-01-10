var Bugsnag = require('@bugsnag/browser')
var bugsnagVue = require('@bugsnag/plugin-vue')
var Vue = require('vue/dist/vue.common.js')
var config = require('./lib/config')

Bugsnag.init(config)
Bugsnag.use(bugsnagVue, Vue)

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
