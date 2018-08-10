const domain = require('domain') // eslint-disable-line
const extractRequestInfo = require('./request-info')
const iserror = require('iserror')

module.exports = {
  name: 'express',
  init: client => {
    const requestHandler = (req, res, next) => {
      const dom = domain.create()

      // Start a session whether sessions are used or not. We use this
      // to store request-specific info, in case of any errors.
      const sessionClient = client.startSession()

      // attach it to the request
      req.bugsnag = sessionClient

      // extract request info and pass it to the relevant bugsnag properties
      const requestInfo = extractRequestInfo(req)
      sessionClient.metaData = { ...sessionClient.metaData, request: requestInfo }
      sessionClient.request = {
        clientIp: requestInfo.clientIp,
        headers: requestInfo.headers,
        httpMethod: requestInfo.httpMethod,
        url: requestInfo.url,
        referer: requestInfo.referer
      }

      // unhandled errors caused by this request
      dom.on('error', (err) => {
        req.bugsnag.notify(createReportFromErr(err), {}, (e, report) => {
          if (e) return client._logger('Failed to send report to Bugsnag')
          req.bugsnag.config.onUnhandledError(err, report, client._logger)
        })
        if (!res.headerSent) res.sendStatus(500)
      })

      return dom.run(next)
    }

    const errorHandler = (err, req, res, next) => {
      let c = req.bugsnag
      if (!c) {
        client._logger.warn(
          'req.bugsnag is not defined. Make sure the @bugsnag/plugin-express requestHandler middleware is added first.',
          'Some request information will be missing.'
        )
        c = client
      }
      c.notify(createReportFromErr(err))
      next(err)
    }

    const createReportFromErr = err => {
      const handledState = {
        severity: 'error',
        unhandled: true,
        severityReason: {
          type: 'unhandledErrorMiddleware',
          attributes: { framework: 'Express/Connect' }
        }
      }
      const actualError = iserror(err)
        ? err
        : new Error('Handled a non-error. See "error" tab for more detail.')
      const report = new client.BugsnagReport(
        actualError.name,
        actualError.message,
        client.BugsnagReport.getStacktrace(actualError),
        handledState
      )
      if (err !== actualError) report.updateMetaData('error', 'non-error value', err)
      return report
    }

    return { requestHandler, errorHandler }
  }
}

module.exports['default'] = module.exports
