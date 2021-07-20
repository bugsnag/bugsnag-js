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
      if (ignoredUrls.includes(url)) {
        return request
      }

      request.on('response', response => {
        const success = response.statusCode < 400

        client.leaveBreadcrumb(
          `net.request ${success ? 'succeeded' : 'failed'}`,
          { request: `${method} ${url}`, status: response.statusCode },
          BREADCRUMB_REQUEST
        )
      })

      request.on('abort', () => {
        client.leaveBreadcrumb(
          'net.request aborted',
          { request: `${method} ${url}` },
          BREADCRUMB_REQUEST
        )
      })

      request.on('error', (error) => {
        client.leaveBreadcrumb(
          'net.request error',
          { request: `${method} ${url}`, error: error.message },
          BREADCRUMB_REQUEST
        )
      })

      return request
    }
  }
})
