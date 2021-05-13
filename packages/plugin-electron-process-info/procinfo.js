const isPreload =
  // is the process actually node-like (webpack defines a "global" variable when bundling, but node's
  // global contains a circular reference to itself global.global)
  typeof global !== 'undefined' && typeof global.global !== 'undefined' && global.global === global &&
  // AND is the process browser-like (does the process have a window and a document?)
  typeof window !== 'undefined' && typeof document !== 'undefined'

module.exports = (source = process) => ({
  load: (client) => {
    client.addOnError(function (event) {
      const info = {}
      if (typeof source.getHeapStatistics === 'function') {
        // heapStatistics is only available in main
        info.heapStatistics = source.getHeapStatistics()
      }

      if (isPreload) {
        info.type = 'preload'
      } else if (event.getMetadata('process', 'type') !== 'preload' && typeof source.type === 'string') {
        // type should always be available
        info.type = source.type
      }

      if (typeof source.sandboxed === 'boolean') {
        // sandboxed is only present in renderers
        info.sandboxed = source.sandboxed === true
      }

      if (typeof source.isMainFrame === 'boolean') {
        // isMainFrame is only present in renderers
        info.isMainFrame = source.isMainFrame === true
      }

      event.addMetadata('process', info)
    }, true)
  }
})
