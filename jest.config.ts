import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  clearMocks: true
}

export default config
