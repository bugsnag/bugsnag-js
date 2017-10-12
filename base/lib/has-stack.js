module.exports = err => !!err && (!!err.stack || !!err.stacktrace || !!err['opera#sourceloc'])
