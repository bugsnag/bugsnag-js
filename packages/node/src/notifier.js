const name = 'Bugsnag Node'
const version = '__VERSION__'
const url = 'prototypeeeee'

const Client = require('@bugsnag/core/client')
// const Report = require('@bugsnag/core/report')
// const Session = require('@bugsnag/core/session')
// const Breadcrumb = require('@bugsnag/core/breadcrumb')
const { reduce } = require('@bugsnag/core/lib/es-utils')
const https = require('https')
const { parse } = require('url')
const fs = require('fs')
const process = require('process')

// extend the base config schema with some node-specific options
const schema = { ...require('@bugsnag/core/config').schema, ...require('./config') }

const plugins = [
  {
    init: client => client.config.beforeSend.push(report => {
      report.stacktrace = report.stacktrace.map(stackframe => {
        if (!stackframe.lineNumber || !stackframe.file) return stackframe
        const start = stackframe.lineNumber - 4
        const end = stackframe.lineNumber + 4
        try {
          stackframe.code = fs.readFileSync(stackframe.file, 'utf8')
            .split('\n')
            .slice(start, end)
            .reduce((accum, line, i) => {
              accum[start + (i + 1)] = line
              return accum
            }, {})
          return stackframe
        } catch (e) {
          return stackframe
        }
      })
    })
  },
  {
    init: client => client.config.beforeSend.push(report => {
      report.stacktrace = report.stacktrace.map(stackframe => {
        stackframe.file = stackframe.file.replace(client.config.projectRoot, '')
        return stackframe
      })
    }),
    configSchema: {
      projectRoot: {
        defaultValue: () => process.cwd(),
        validate: value => typeof value === 'string' && value.length,
        message: 'should be string'
      }
    }
  }
]

module.exports = (opts, userPlugins = []) => {
  // handle very simple use case where user supplies just the api key as a string
  if (typeof opts === 'string') opts = { apiKey: opts }

  // allow plugins to augment the schema with their own options
  const pls = [].concat(plugins).concat(userPlugins)
  const finalSchema = reduce(pls, (accum, plugin) => {
    if (!plugin.configSchema) return accum
    return Object.assign({}, accum, plugin.configSchema)
  }, schema)

  const bugsnag = new Client({ name, version, url }, finalSchema)

  bugsnag.delivery(delivery())
  bugsnag.configure(opts)

  pls.forEach(pl => bugsnag.use(pl))

  return bugsnag
}

const delivery = () => {
  return {
    sendReport: (logger, config, report) => {
      const req = https.request({
        method: 'POST',
        ...parse(config.endpoints.notify)
      })
      req.setHeader('Content-Type', 'application/json')
      req.setHeader('Bugsnag-Api-Key', report.apiKey || config.apiKey)
      req.setHeader('Bugsnag-Payload-Version', '4.0')
      req.setHeader('Bugsnag-Sent-At', (new Date()).toISOString())
      req.end(JSON.stringify(report))
      console.log(JSON.stringify(report, null, 2))
      req.on('response', r => {
        r.on('data', () => {})
        r.on('finish', () => console.log('done'))
      })
    },
    sendSession: (logger, config, session) => {
      console.log('noop')
    }
  }
}
