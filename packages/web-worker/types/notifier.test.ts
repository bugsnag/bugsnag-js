import type { WorkerConfig } from './notifier';

describe('WorkerConfig type', () => {
  it('should allow apiKey and custom fields', () => {
    // This should type-check without error
    const config: WorkerConfig = {
      apiKey: '123',
      collectUserIp: true,
      generateAnonymousId: false
    };
    expect(config.apiKey).toBe('123');
    expect(config.collectUserIp).toBe(true);
    expect(config.generateAnonymousId).toBe(false);
  });

  it('should error if apiKey is missing', () => {
    // @ts-expect-error: apiKey is required
    const config: WorkerConfig = {
      collectUserIp: true,
      generateAnonymousId: false
    };
    expect(config).toBeDefined();
  });
});
