// Run default and electron runner tests as a single suite
const { projects } = require('./electron-jest.config')
const config = require('../jest.config')

config.projects.push(...projects)

module.exports = config
