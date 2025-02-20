const { join, resolve } = require('path')

// normalise a path to a directory, adding a trailing slash if it doesn't already
// have one and resolve it to make it absolute (e.g. get rid of any ".."s)
module.exports = p => join(resolve(p), '/')
