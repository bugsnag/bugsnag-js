module.exports = (source = process) => ({
  load: (client) => {
    client.addOnError(function (event) {
      const info = {}
      if (typeof source.getHeapStatistics === 'function') {
        info.heapStatistics = source.getHeapStatistics()
      }

      if (typeof source.type === 'string') {
        info.type = source.type
      }

      // sandboxed can be undefined and is assumed false
      info.sandboxed = source.sandboxed === true

      // when the current process is the main frame, isMainFrame is guaranteed
      // to be true, no guarantees about the inverse case
      info.isMainFrame = source.isMainFrame === true

      event.addMetadata('process', info)
    }, true)
  }
})
