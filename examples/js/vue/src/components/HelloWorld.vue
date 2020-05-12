<template>
  <div>
    <img width="200" src="bugsnag.png" alt="Bugsnag Logo" />
    <h1>Vue example</h1>
    <p>
      This is an example of how to include <code>@bugsnag/js</code> and <code>@bugsnag/plugin-vue</code> in a Vue app.
    </p>
    <BadButtons />
  </div>
</template>

<script>
import BadButtons from './BadButtons'
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  components: { BadButtons }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,h3 {
  margin-top: 30px;
}
</style>
