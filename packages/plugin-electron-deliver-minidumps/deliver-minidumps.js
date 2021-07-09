const { crashReporter } = require('electron')
const MinidumpDeliveryLoop = require('./minidump-loop')
const MinidumpQueue = require('./minidump-queue')
const sendMinidumpFactory = require('./send-minidump')

module.exports = (app, net, filestore) => ({
  name: 'deliverMinidumps',
  load: (client) => {
    // make sure that the Electron CrashReporter is configured
    crashReporter.start({
      submitURL: '',
      uploadToServer: false
    })

    app.on('ready', () => {
      const { sendMinidump } = sendMinidumpFactory(net, client)

      const minidumpQueue = new MinidumpQueue(filestore)
      const minidumpLoop = new MinidumpDeliveryLoop(sendMinidump, client._config.onSend, minidumpQueue, client._logger)

      minidumpLoop.start()
    })
  }
})
