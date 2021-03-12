const { join } = require('path')

module.exports = {
  fixturePath: (name) => {
    return join(__dirname, `../../fixtures/events/${name}`)
  }
}
