module.exports = (NativeClient) => ({
  load: (client) => {
    const isTurboModuleEnabled = global.RN$Bridgeless || global.__turboModuleProxy != null

    if (isTurboModuleEnabled) {
      client.addOnError(event => {
        const payloadInfo = NativeClient.getPayloadInfo({ unhandled: event.unhandled })
        syncEvent(payloadInfo, event)
      }, true)
    } else {
      client.addOnError(async event => {
        const payloadInfo = await NativeClient.getPayloadInfoAsync({ unhandled: event.unhandled })
        syncEvent(payloadInfo, event)
      }, true)
    }
  }
})

const syncEvent = (payloadInfo, event) => {
  const {
    threads,
    breadcrumbs,
    app,
    device,
    deviceMetadata,
    appMetadata
  } = payloadInfo

  event.breadcrumbs = breadcrumbs
  event.app = { ...event.app, ...app }
  event.device = { ...event.device, ...device }
  event.threads = threads
  event.addMetadata('device', deviceMetadata)
  event.addMetadata('app', appMetadata)
}
