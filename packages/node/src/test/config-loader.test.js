const { describe, it, expect } = global

// const loadConfig = require('../config-loader')
const { execSync } = require('child_process')

describe('config loader', () => {
  describe('loadConfig()', () => {
    it('works with process cwd', () => {
      const str = execSync('node app.js', { cwd: `${__dirname}/fixtures/config-loader`, encoding: 'utf8' })
      const config = JSON.parse(str)
      expect(config.apiKey).toBe('123')
      expect(config.releaseStage).toBe('jim')
    })

    it('works with app entrypoint', () => {
      const str = execSync('node alt/entrypoint.js', { cwd: `${__dirname}/fixtures/config-loader`, encoding: 'utf8' })
      const config = JSON.parse(str)
      expect(config.apiKey).toBe('123')
      expect(config.releaseStage).toBe('jim')
    })
  })
})
