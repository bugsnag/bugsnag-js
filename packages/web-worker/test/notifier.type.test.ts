import type { WorkerConfig } from '../types/notifier'

describe('WorkerConfig type', () => {
  it('should allow required fields', () => {
    // This should type-check without error
    const config: WorkerConfig = {
      apiKey: '123',
      collectUserIp: true,
      generateAnonymousId: false
    }
    expect(config.apiKey).toBe('123')
    expect(config.collectUserIp).toBe(true)
    expect(config.generateAnonymousId).toBe(false)
  })

  it('should error if apiKey is missing', () => {
    // @ts-expect-error: apiKey is required
    const missingApiKey: WorkerConfig = {
      collectUserIp: true,
      generateAnonymousId: false
    }
    expect(missingApiKey).toBeDefined()

    // @ts-expect-error: collectUserIp is required
    const missingCollectUserIp: WorkerConfig = {
      apiKey: '123',
      generateAnonymousId: false
    }
    expect(missingCollectUserIp).toBeDefined()

    // @ts-expect-error: generateAnonymousId is required
    const missingGenerateAnonymousId: WorkerConfig = {
      apiKey: '123',
      collectUserIp: true
    }
    expect(missingGenerateAnonymousId).toBeDefined()
  })
}
)
