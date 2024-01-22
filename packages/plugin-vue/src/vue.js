module.exports = (app, client) => {
  const prev = app.config.errorHandler

  const handler = (err, vm, info) => {
    const handledState = { severity: 'error', unhandled: true, severityReason: { type: 'unhandledException' } }
    const event = client.Event.create(err, true, handledState, 'vue error handler', 1)

    // In Vue 3.4+, the info param is a link to the Vue error docs in prod, so we need to extract the error code from it
    // https://github.com/vuejs/core/pull/9165/commits/c261beab2c0a26e401f2c3d5eae2e4c41de6fe4d
    const code = typeof info === 'string' && info.indexOf('runtime-') > 0 ? info.split('runtime-')[1] : info
    const errorInfo = ErrorTypeStrings[code] || info

    event.addMetadata('vue', {
      errorInfo,
      component: vm ? formatComponentName(vm, true) : undefined,
      props: (vm && vm.$options) ? vm.$options.propsData : undefined
    })

    client._notify(event)
    if (typeof console !== 'undefined' && typeof console.error === 'function') console.error(err)

    if (typeof prev === 'function') prev.call(this, err, vm, info)
  }

  app.config.errorHandler = handler
}

function formatComponentName (vm) {
  if (vm.$parent === null) return 'App'
  return (vm.$options && vm.$options.name) ? vm.$options.name : 'Anonymous'
}

// We copy in the following data structures from Vue's source so we can map the "info" parameter in the errorhandler
// callback (which is supplied as either a string or int) back to something meaningful

// https://github.com/vuejs/vue-next/blob/d5cce47789db8f37b9f5f8ea6602ea63e3a04b07/packages/runtime-core/src/component.ts#L153-L167
const LifecycleHooks = {
  BEFORE_CREATE: 'bc',
  CREATED: 'c',
  BEFORE_MOUNT: 'bm',
  MOUNTED: 'm',
  BEFORE_UPDATE: 'bu',
  UPDATED: 'u',
  BEFORE_UNMOUNT: 'bum',
  UNMOUNTED: 'um',
  DEACTIVATED: 'da',
  ACTIVATED: 'a',
  RENDER_TRIGGERED: 'rtg',
  RENDER_TRACKED: 'rtc',
  ERROR_CAPTURED: 'ec'
}

// https://github.com/vuejs/vue-next/blob/d5cce47789db8f37b9f5f8ea6602ea63e3a04b07/packages/runtime-core/src/errorHandling.ts#L6-L24
const ErrorCodes = {
  SETUP_FUNCTION: 0,
  RENDER_FUNCTION: 1,
  WATCH_GETTER: 2,
  WATCH_CALLBACK: 3,
  WATCH_CLEANUP: 4,
  NATIVE_EVENT_HANDLER: 5,
  COMPONENT_EVENT_HANDLER: 6,
  VNODE_HOOK: 7,
  DIRECTIVE_HOOK: 8,
  TRANSITION_HOOK: 9,
  APP_ERROR_HANDLER: 10,
  APP_WARN_HANDLER: 11,
  FUNCTION_REF: 12,
  ASYNC_COMPONENT_LOADER: 13,
  SCHEDULER: 14
}

// https://github.com/vuejs/vue-next/blob/d5cce47789db8f37b9f5f8ea6602ea63e3a04b07/packages/runtime-core/src/errorHandling.ts#L26-L57
const ErrorTypeStrings = {
  [LifecycleHooks.BEFORE_CREATE]: 'beforeCreate hook',
  [LifecycleHooks.CREATED]: 'created hook',
  [LifecycleHooks.BEFORE_MOUNT]: 'beforeMount hook',
  [LifecycleHooks.MOUNTED]: 'mounted hook',
  [LifecycleHooks.BEFORE_UPDATE]: 'beforeUpdate hook',
  [LifecycleHooks.UPDATED]: 'updated',
  [LifecycleHooks.BEFORE_UNMOUNT]: 'beforeUnmount hook',
  [LifecycleHooks.UNMOUNTED]: 'unmounted hook',
  [LifecycleHooks.ACTIVATED]: 'activated hook',
  [LifecycleHooks.DEACTIVATED]: 'deactivated hook',
  [LifecycleHooks.ERROR_CAPTURED]: 'errorCaptured hook',
  [LifecycleHooks.RENDER_TRACKED]: 'renderTracked hook',
  [LifecycleHooks.RENDER_TRIGGERED]: 'renderTriggered hook',
  [ErrorCodes.SETUP_FUNCTION]: 'setup function',
  [ErrorCodes.RENDER_FUNCTION]: 'render function',
  [ErrorCodes.WATCH_GETTER]: 'watcher getter',
  [ErrorCodes.WATCH_CALLBACK]: 'watcher callback',
  [ErrorCodes.WATCH_CLEANUP]: 'watcher cleanup function',
  [ErrorCodes.NATIVE_EVENT_HANDLER]: 'native event handler',
  [ErrorCodes.COMPONENT_EVENT_HANDLER]: 'component event handler',
  [ErrorCodes.VNODE_HOOK]: 'vnode hook',
  [ErrorCodes.DIRECTIVE_HOOK]: 'directive hook',
  [ErrorCodes.TRANSITION_HOOK]: 'transition hook',
  [ErrorCodes.APP_ERROR_HANDLER]: 'app errorHandler',
  [ErrorCodes.APP_WARN_HANDLER]: 'app warnHandler',
  [ErrorCodes.FUNCTION_REF]: 'ref function',
  [ErrorCodes.ASYNC_COMPONENT_LOADER]: 'async component loader',
  [ErrorCodes.SCHEDULER]:
    'scheduler flush. This is likely a Vue internals bug. ' +
    'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/vue-next'
}
