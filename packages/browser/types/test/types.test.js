const { describe, it, expect } = global

const { spawnSync } = require('child_process')

const assertTsProgramCompiles = p => {
  const { stdout, stderr, err } = spawnSync('./node_modules/.bin/tsc', [
    '--strict',
    '--noEmit',
    `${__dirname}/fixtures/${p}.ts`
  ], { encoding: 'utf8' })
  expect(err).toBeFalsy()
  expect(stderr).toBe('')
  expect(stdout).toBe('')
}

describe('types', () => {
  it('should compile a typescript program successfully', () => {
    assertTsProgramCompiles('all-options')
  })

  it('should have access to all public types', () => {
    assertTsProgramCompiles('exposed-types')
  })

  it('should work with breadcrumbs', () => {
    assertTsProgramCompiles('breadcrumb-types')
  })

  it('should work with plugins', () => {
    assertTsProgramCompiles('plugins')
  })

  it('should work with the notify() callback', () => {
    assertTsProgramCompiles('notify-callback')
  })
})
