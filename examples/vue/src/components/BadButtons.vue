<template>
  <div id="buttons">
    <h3>Send some errors by clicking below:</h3>
    <button v-on:click="sendHandled">Send handled</button>
    <button v-on:click="sendUnhandled">Send unhandled</button>
    <button v-on:click="toggleOk">Trigger a render error</button>
    <button v-on:click="triggerNextTickError">Throw an error during Vue.nextTick()</button>
    <button v-on:click="triggerWatchError">Trigger a handled watch error</button>
    <span v-if="!ok">{{ list[10].text }}</span>
  </div>
</template>

<script>
import Vue from 'vue'
import bugsnagClient from '../lib/bugsnag'
export default {
  name: 'BadButtons',
  data: () => ({
    ok: true,
    list: [],
    doAWatchError: false
  }),
  watch: {
    doAWatchError: function (val) {
      if (val) throw new Error('Bad thing!')
    }
  },
  methods: {
    // Tell the bugsnagClient about an error that was handled
    sendHandled: function () {
      try {
        throw new Error('Catch me if you can')
      } catch (e) {
        bugsnagClient.notify(e)
      }
    },
    // Throws an error outside in a timer which will be reported buy the bugsnagClient
    sendUnhandled: function () {
      setTimeout(() => {
        throw new Error('Crashy')
      })
    },
    // Sets the data in such a way that the next render of the component will throw an error
    toggleOk: function () {
      this.ok = !this.ok
    },
    // Throws an error using Vue.js's nextTick() function
    triggerNextTickError: function () {
      Vue.nextTick(function () {
        JSON.parse('definitely not json')
      })
    },
    // Changes the value being watched such that it throws an error
    triggerWatchError: function () {
      this.doAWatchError = true
      setTimeout(function () {
        this.doAWatchError = false
      }.bind(this), 100)
    }
  }
}
</script>

<style scoped>
button {
  font-size: 16px;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background-color: rgba(73, 73, 228, 1);
  color: #FFF;
  border: none;
  border-radius: 2px;
  margin: .5rem .125rem .5rem 0;
  padding: .5rem 1rem;
  cursor: pointer;
}

button:hover {
  background-color: rgba(73, 73, 228, .8);
}
</style>
