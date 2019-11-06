module.exports = {
  name: 'vue',
  init: (client, Vue = window.Vue) => {
    if (!Vue) throw new Error('cannot find Vue')
    const prev = Vue.config.errorHandler

    const handler = (err, vm, info) => {
      const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
      const event = new client.Event(err.name, err.message, client.Event.getStacktrace(err), err, handledState)

      client._notify(event, event => {
        event.addMetadata('vue', {
          errorInfo: info,
          component: vm ? formatComponentName(vm, true) : undefined,
          props: vm ? vm.$options.propsData : undefined
        })
      })

      if (typeof console !== 'undefined' && typeof console.error === 'function') console.error(err)
      if (typeof prev === 'function') prev.call(this, err, vm, info)
    }

    Vue.config.errorHandler = handler
    return null
  }
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
