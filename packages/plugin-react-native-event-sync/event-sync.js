module.exports = {
  init: (client, NativeClient) => {
    client.addOnError(async event => {
      const {
        threads,
        breadcrumbs,
        app,
        device
      } = await NativeClient.getPayloadInfo()

      event.breadcrumbs = breadcrumbs
      event.app = { ...event.app, ...app }
      event.device = { ...event.device, ...device }
      event.threads = threads
    }, true)
  }
}
