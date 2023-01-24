const BREADCRUMB_REQUEST = 'request'

module.exports = net => ({
  load (client) {
    if (!client._isBreadcrumbTypeEnabled(BREADCRUMB_REQUEST)) {
      return
    }

    // we don't want to track requests to Bugsnag endpoints - this array includes
    // the urls with & without a trailing '/' as Electron will sometimes add one
    const ignoredUrls = Object.values(client._config.endpoints)
      .flatMap(
        url => url.endsWith('/')
          ? [url, url.substring(0, url.length - 1)]
          : [url, `${url}/`]
      )

    const originalRequest = net.request

    net.request = (...args) => {
      const request = originalRequest.apply(net, args)

      // grab the final URL from the internal "_urlLoaderOptions" - there is some
      // processing of the raw URL that we don't want to have to replicate here
      const url = request._urlLoaderOptions.url
      const method = request._urlLoaderOptions.method

      // don't leave breadcrumbs for Bugsnag endpoints
      // minidump requests will have an 'api_key' query string parameter, which
      // we need to remove here
      if (typeof url === 'string' && ignoredUrls.includes(url.replace(/\?.*$/, ''))) {
        return request
      }

      let requestStart

      // For chunked requests the request begins on the first write operation,
      // otherwise the request begins when the request is finalised
      const originalWrite = request.write
      request.write = (...args) => {
        if (request.chunkedEncoding && !requestStart) requestStart = new Date()
        originalWrite.apply(request, args)
      }

      const originalEnd = request.end
      request.end = (...args) => {
        if (!requestStart) requestStart = new Date()
        originalEnd.apply(request, args)
      }

      request.on('response', response => {
        const success = response.statusCode < 400

        client.leaveBreadcrumb(
          `net.request ${success ? 'succeeded' : 'failed'}`,
          { request: `${method} ${url}`, status: response.statusCode, duration: getDuration(requestStart) },
          BREADCRUMB_REQUEST
        )
      })

      request.on('abort', () => {
        client.leaveBreadcrumb(
          'net.request aborted',
          { request: `${method} ${url}`, duration: getDuration(requestStart) },
          BREADCRUMB_REQUEST
        )
      })

      request.on('error', (error) => {
        client.leaveBreadcrumb(
          'net.request error',
          { request: `${method} ${url}`, error: error.message, duration: getDuration(requestStart) },
          BREADCRUMB_REQUEST
        )
      })

      return request
    }
  }
})

const getDuration = (startTime) => startTime && new Date() - startTime
