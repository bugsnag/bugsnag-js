/* global describe, it, expect, Blob, Worker */

describe('using bugsnag with web workers', function () {
  let scriptContent = [`
    try {
      importScripts(location.origin + '/base/webworker/serve/bugsnag.dist.js')

      let client = bugsnag('MY_API_KEY')

      client.transport({
        sendReport: function (logger, config, report) {
          self.postMessage(JSON.stringify({ type: 'data', report: report }))
        }
      })
    } catch(e) {
      self.postMessage(JSON.stringify({ type: 'error', error: e.message }))
    }
  `]

  it('should catch exceptions', function (done) {
    let workerFunction = scriptContent.concat(`throw new Error('foo');`).join('\n')
    let blob = new Blob([workerFunction.toString()])
    let blobURL = window.URL.createObjectURL(blob)
    let worker = new Worker(blobURL)

    worker.addEventListener('message', (event) => {
      worker.terminate()

      if (!event) return

      let data = JSON.parse(event.data)

      expect(data.type === 'error').toBe(false)
      expect(data.error).toBeUndefined()
      expect(data.report).toBeDefined()
      expect(data.report.events[0].severityReason.type).toBe('unhandledException')
      done()
    }, false)
  })

  it('should catch promise rejected', function (done) {
    let workerFunction = scriptContent.concat(`new Promise(( _, reject)=> { reject() });`).join('\n')
    let blob = new Blob([workerFunction.toString()])
    let blobURL = window.URL.createObjectURL(blob)
    let worker = new Worker(blobURL)

    worker.addEventListener('message', (event) => {
      worker.terminate()

      if (!event) return

      let data = JSON.parse(event.data)

      expect(data.type === 'error').toBe(false)
      expect(data.error).toBeUndefined()
      expect(data.report).toBeDefined()
      expect(data.report.events[0].severityReason.type).toBe('unhandledPromiseRejection')
      done()
    }, false)
  })
})
