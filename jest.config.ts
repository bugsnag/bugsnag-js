import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  clearMocks: true,
  modulePathIgnorePatterns: ['.verdaccio', 'test/fixtures', 'test\\fixtures']
}

export default config
