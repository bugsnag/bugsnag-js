module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnError(event => {
      if(global.MazeRunnerNative && global.MazeRunnerNative.getMessage) {
        console.log('in event-sync callback, invoking MazeRunnerNative.getMessage')
        global.MazeRunnerNative.getMessage(event.toString())
          .then(result => {
            console.log('event-sync returned from MazeRunnerNative.getMessage', result)
          })
      }

      console.log('in event-sync callback, invoking getPayloadInfo', NativeClient && typeof NativeClient.getPayloadInfo, NativeClient)
      return NativeClient.getPayloadInfo({ unhandled: event.unhandled })
        .then(({
          threads,
          breadcrumbs,
          app,
          device,
          deviceMetadata,
          appMetadata
        }) => {
          console.log('continue with error-sync callback')
          event.breadcrumbs = breadcrumbs
          event.app = { ...event.app, ...app }
          event.device = { ...event.device, ...device }
          event.threads = threads
          event.addMetadata('device', deviceMetadata)
          event.addMetadata('app', appMetadata)
        })
        .catch(e => console.log('error caught while trying to call getPayloadInfo', e))
    }, true)
  }
})
