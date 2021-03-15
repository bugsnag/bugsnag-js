module.exports = (Vue, client) => {
  const prev = Vue.config.errorHandler

  const handler = (err, vm, info) => {
    const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
    const event = client.Event.create(err, true, handledState, 'vue error handler', 1)

    event.addMetadata('vue', {
      errorInfo: info,
      component: vm ? formatComponentName(vm, true) : undefined,
      props: vm ? vm.$options.propsData : undefined
    })

    client._notify(event)
    if (typeof console !== 'undefined' && typeof console.error === 'function') console.error(err)

    if (typeof prev === 'function') prev.call(this, err, vm, info)
  }

  Vue.config.errorHandler = handler
}

// taken and reworked from Vue.js source
const formatComponentName = (vm, includeFile) => {
  if (vm.$root === vm) return '<Root>'
  const options = typeof vm === 'function' && vm.cid != null
    ? vm.options
    : vm._isVue
      ? vm.$options || vm.constructor.options
      : vm || {}
  let name = options.name || options._componentTag
  const file = options.__file
  if (!name && file) {
    const match = file.match(/([^/\\]+)\.vue$/)
    name = match && match[1]
  }

  return (
    (name ? ('<' + (classify(name)) + '>') : '<Anonymous>') +
    (file && includeFile !== false ? (' at ' + file) : '')
  )
}

// taken and reworked from Vue.js source
const classify = module.exports.classify = str =>
  str.replace(/(?:^|[-_])(\w)/g, c => c.toUpperCase()).replace(/[-_]/g, '')
