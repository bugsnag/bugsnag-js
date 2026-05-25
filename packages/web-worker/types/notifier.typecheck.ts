// This file intentionally performs compile-time validation for the public type.
// It avoids runtime test constructs so it can safely live alongside published
// type entrypoints without depending on a test framework.
import type { WorkerConfig } from './notifier'

const config: WorkerConfig = {
  apiKey: '123',
  collectUserIp: true,
  generateAnonymousId: false
}
const apiKey = config.apiKey
const collectUserIp = config.collectUserIp
const generateAnonymousId = config.generateAnonymousId
void apiKey
void collectUserIp
void generateAnonymousId
// @ts-expect-error: apiKey is required
const invalidConfig: WorkerConfig = {
  collectUserIp: true,
  generateAnonymousId: false
}
void invalidConfig
export {}
