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

module.exports = BugsnagBreadcrumb
