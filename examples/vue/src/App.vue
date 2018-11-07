<template>
  <div id="app">
    <HelloWorld />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'app',
  components: {
    HelloWorld
  }
}
</script>

<style>
body {
  font-family: monospace;
  max-width: 600px;
  margin: 50px auto;
  padding: 0 20px;
}
</style>
