class BugsnagBreadcrumb {
  constructor (type, name, metaData = {}, timestamp = (new Date()).toISOString()) {
    // duck-typing ftw >_<
    this.__isBugsnagBreadcrumb = true

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

BugsnagBreadcrumb.ensureBreadcrumb = (...args) => {
  if (args.length === 1 && args[0] && args[0].__isBugsnagBreadcrumb) return args[0]
  const [ name, metaData, timestamp ] = args
  return new BugsnagBreadcrumb('manual', name, metaData, timestamp)
}

module.exports = BugsnagBreadcrumb
