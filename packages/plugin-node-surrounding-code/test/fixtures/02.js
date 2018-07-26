// this is just some arbitrary (but real) javascript for testing, taken from
// https://github.com/bengourley/find-nearest-file/

module.exports = find

var fs = require('fs')
  , path = require('path')

function find(filename, root) {

  root = root || process.cwd();

  if (!filename) throw new Error('filename is required')

  if (filename.indexOf('/') !== -1 || filename === '..') {
    throw new Error('filename must be just a filename and not a path')
  }


  function findFile(directory, filename) {

    var file = path.join(directory, filename)

    try {
      // Get the stat for the path, and if this doesn't throw, make sure it's a file
      if (fs.statSync(file).isFile()) return file
      // stat existed, but isFile() returned false
      return nextLevelUp()
    } catch (e) {
      // stat did not exist
      return nextLevelUp()
    }

    function nextLevelUp() {
      // Don't proceed to the next directory when already at the fs root
      if (directory === path.resolve('/')) return null
      return findFile(path.dirname(directory), filename)
    }

  }

  return findFile(root, filename)

}
