module.exports = {
  init: (client, NativeClient) => {
    client.addOnError(async event => {
      // const info = await NativeClient.getPayloadInfo()
      // report.set(info)
    }, true)
  }
}
