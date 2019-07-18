const { map } = require('./es-utils')

module.exports = (host, hostName, deprecatedProps) => {
  map(deprecatedProps, prop => Object.defineProperty(host, prop, {
    set: function (value) {
      if (prop !== 'metaData') {
        host._logger.error(`Setting "${hostName}.${prop}" directly is no longer supported. Use "${hostName}.set('${prop}', value)" instead.`)
        host.set(prop, value)
      } else {
        host._logger.error(`Setting "${hostName}.metaData = value" is no longer supported. Use "${hostName}.set(value)" instead.`)
        host.set(value)
      }
    },
    get: function () {
      if (prop !== 'metaData') {
        host._logger.error(`Getting "${hostName}.${prop}" directly is no longer supported. Use "${hostName}.get('${prop}')" instead.`)
        return host.get(prop)
      } else {
        host._logger.error(`Getting "${hostName}.metaData" directly is no longer supported. Use "${hostName}.get(metaDataKey)" instead.`)
      }
    }
  }))
}
