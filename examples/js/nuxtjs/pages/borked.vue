<template>
</template>

<script>
export default {
  asyncData: () => {
    throw new Error('borked')
  },
  name: 'Borked',
  props: {},
  components: {}
}
</script>
