module.exports = (NativeClient) => ({
  load: (client) => {
    client.addOnError(async event => {
      const {
        threads,
        breadcrumbs,
        app,
        device,
        deviceMetadata,
        appMetadata
      } = await NativeClient.getPayloadInfo({ unhandled: event.unhandled })

      event.breadcrumbs = breadcrumbs
      event.app = { ...event.app, ...app }
      event.device = { ...event.device, ...device }
      event.threads = threads
      event.addMetadata('device', deviceMetadata)
      event.addMetadata('app', appMetadata)
    }, true)
  }
})
