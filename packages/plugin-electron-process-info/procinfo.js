module.exports = (source = process) => ({
  load: (client) => {
    client.addOnError(function (event) {
      const info = {}
      if (typeof source.getHeapStatistics === 'function') {
        // heapStatistics is only available in main
        info.heapStatistics = source.getHeapStatistics()
      }

      if (typeof source.type === 'string') {
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
