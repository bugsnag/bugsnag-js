// Given `err` which may be an error, does it have a stack property which is a string?
module.exports = err =>
  !!err &&
  (!!err.stack || !!err.stacktrace || !!err['opera#sourceloc']) &&
  typeof (err.stack || err.stacktrace || err['opera#sourceloc']) === 'string' &&
  err.stack !== `${err.name}: ${err.message}`
