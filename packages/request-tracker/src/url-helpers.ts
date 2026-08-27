import { Client } from '@bugsnag/core'

export function shouldIgnoreUrl (url: string, ignoredUrls: string[] = []): boolean {
  if (!url || typeof url !== 'string') return true

  const urlWithoutQuery = url.replace(/\?.*$/, '')

  return ignoredUrls.includes(urlWithoutQuery)
}

export function createUrlFilter (client: Client, additionalIgnoredUrls: string[] = []) {
  const ignoredUrls = [
    client._config.endpoints.notify,
    client._config.endpoints.sessions
  ].concat(additionalIgnoredUrls).filter(Boolean)

  return (url: string) => shouldIgnoreUrl(url, ignoredUrls)
}

export function getDuration (startTime: number): number {
  return startTime && Date.now() - startTime
}
