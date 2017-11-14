const { isoDate } = require('./lib/es-utils')

class BugsnagBreadcrumb {
  constructor (name = '[anonymous]', metaData = {}, type = 'manual', timestamp = isoDate()) {
    this.type = type
    this.name = name
    this.metaData = metaData
    this.timestamp = timestamp
  }

  toJSON () {
    return {
      type: this.type,
      name: this.name,
      timestamp: this.timestamp,
      metaData: this.metaData
    }
  }
}

// force `fast-safe-stringify` to do its thing
// https://github.com/davidmarkclements/fast-safe-stringify#tojson-support
BugsnagBreadcrumb.prototype.toJSON.forceDecirc = true

module.exports = BugsnagBreadcrumb
