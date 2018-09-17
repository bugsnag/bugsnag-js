var bugsnag = require('@bugsnag/browser')
var bugsnagVue = require('@bugsnag/plugin-vue')
var Vue = require('vue/dist/vue.common.js')
var config = require('./lib/config')

var bugsnagClient = bugsnag(config)
bugsnagClient.use(bugsnagVue, Vue)

setTimeout(function () {
  var el = document.getElementById('bugsnag-test-state')
  el.textContent = el.innerText = 'DONE'
}, 5000)

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
