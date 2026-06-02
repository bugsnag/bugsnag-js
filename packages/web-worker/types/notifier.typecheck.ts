// This file intentionally performs compile-time validation for the public type.
// It avoids runtime test constructs so it can safely live alongside published
// type entrypoints without depending on a test framework.
import type { WorkerConfig } from './notifier'

const _config: WorkerConfig = {
  apiKey: '123',
  collectUserIp: true,
  generateAnonymousId: false
}
const _apiKey = _config.apiKey
const _collectUserIp = _config.collectUserIp
const _generateAnonymousId = _config.generateAnonymousId
// @ts-expect-error: apiKey is required
const _invalidConfig: WorkerConfig = {
  collectUserIp: true,
  generateAnonymousId: false
}
;(function consume (...args: unknown[]) {
  return args
})(_apiKey, _collectUserIp, _generateAnonymousId, _invalidConfig)
export {}
