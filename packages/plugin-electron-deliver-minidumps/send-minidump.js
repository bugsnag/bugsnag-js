const { createReadStream } = require('fs')
const { createGzip } = require('zlib')
const { basename } = require('path')
const payload = require('@bugsnag/core/lib/json-payload')
const FormData = require('form-data')

module.exports = (net, client) => {
  const send = (opts, formData) => {
    return new Promise((resolve, reject) => {
      const req = net.request(opts, response => {
        if (isOk(response)) {
          resolve()
        } else {
          const err = new Error(`Bad status code from API: ${response.statusCode}`)
          err.isRetryable = isRetryable(response.statusCode)
          reject(err)
        }
      })

      req.on('error', reject)

      try {
        formData.pipe(req)
      } catch (err) {
        // if we can't write this body to the request, it's likely impossible to
        // ever send it successfully
        err.isRetryable = false
        reject(err)
      }
    })
  }

  const sendMinidump = async (minidumpPath, event) => {
    const url = new URL(client._config.endpoints.minidumps)
    url.searchParams.set('api_key', client._config.apiKey)

    const minidumpStream = createReadStream(minidumpPath).pipe(createGzip())

    const formData = new FormData()
    formData.append('upload_file_minidump', minidumpStream, {
      filename: basename(minidumpPath)
    })

    if (event) {
      const eventBody = payload.event(event, client._config.redactedKeys)
      formData.append('event', eventBody)
    }

    const opts = {
      url: url.toString(),
      method: 'POST',
      headers: {
        'Bugsnag-Sent-At': new Date().toISOString(),
        ...formData.getHeaders()
      }
    }

    await send(opts, formData)
  }

  return { sendMinidump }
}

// basically, if it starts with a 4, don't retry (unless it's in the list of
// exceptions)
const isRetryable = status => {
  return (
    status < 400 ||
    status > 499 ||
    [
      408, // timeout
      429 // too many requests
    ].includes(status)
  )
}

const isOk = response => [200, 202].includes(response.statusCode)
