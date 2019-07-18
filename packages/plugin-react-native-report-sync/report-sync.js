module.exports = {
  init: (client, NativeClient) => {
    client.config.beforeSend.unshift(async report => {
      const info = await NativeClient.getPayloadInfo()
      report.set(info)
    })
  }
}
