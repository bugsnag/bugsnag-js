const { crashReporter } = require('electron')
const MinidumpDeliveryLoop = require('./minidump-loop')
const MinidumpQueue = require('./minidump-queue')

module.exports = (app, filestore) => ({
  name: 'deliverMinidumps',
  load: (client) => {
    // make sure that the Electron CrashReporter is configured
    crashReporter.start({
      submitURL: '',
      uploadToServer: false
    })

    app.on('ready', () => {
      const minidumpQueue = new MinidumpQueue(filestore)
      const minidumpLoop = new MinidumpDeliveryLoop(client._delivery.sendMinidump, client._config.onSend, minidumpQueue, client._logger)

      minidumpLoop.start()
    })
  }
})
