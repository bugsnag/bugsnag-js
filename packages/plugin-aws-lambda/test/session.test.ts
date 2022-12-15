import Client from '@bugsnag/core/client'
import Session from '@bugsnag/core/session'
import type { Plugin } from '@bugsnag/core'
import BugsnagPluginAwsLambdaSession from '../src/session'

describe('plugin: aws lambda sessions', () => {
  describe('without server plugin', () => {
    it('can start a session', () => {
      const client = createClient()

      expect(client._session).toBeNull()

      const shouldNotBeCloned = client.startSession()

      expect(shouldNotBeCloned).toBe(client)
      expect(client._session).toBeInstanceOf(Session)
      // @ts-ignore
      expect(client._session.toJSON()).toEqual({
        events: {
          handled: 0,
          unhandled: 0
        },
        id: expect.any(String),
        startedAt: expect.any(Date)
      })
    })

    it('can pause and resume a session', () => {
      const client = createClient()

      expect(client._session).toBeNull()

      const shouldNotBeCloned = client.startSession()

      expect(shouldNotBeCloned).toBe(client)
      expect(client._session).toBeInstanceOf(Session)
      const expectedSession = client._session

      client.pauseSession()

      expect(client._session).toBeNull()

      // resumeSession should not clone either
      const resumeSessionClient = client.resumeSession()

      expect(client._session).toBe(expectedSession)
      expect(resumeSessionClient).toBe(client)
    })

    it('does not clone the client with resumeSession if there is no active session', () => {
      const client = createClient()
      const cloned = client.resumeSession()

      expect(cloned).toBe(client)
      expect(client._session).toBeInstanceOf(Session)
    })
  })

  describe.each(['express', 'koa', 'restify'])('with server plugin (%s)', serverPlugin => {
    it('can start a session', () => {
      const client = createClient(serverPlugin)

      expect(client._session).toBeNull()

      const cloned = client.startSession()

      expect(cloned).not.toBe(client)
      expect(client._session).toBeNull()
      expect(cloned._session).toBeInstanceOf(Session)
      // @ts-ignore
      expect(cloned._session.toJSON()).toEqual({
        events: {
          handled: 0,
          unhandled: 0
        },
        id: expect.any(String),
        startedAt: expect.any(Date)
      })
    })

    it('can pause and resume a session', () => {
      const client = createClient(serverPlugin)

      expect(client._session).toBeNull()

      const cloned = client.startSession()

      expect(client._session).toBeNull()
      expect(cloned._session).toBeInstanceOf(Session)
      const expectedSession = cloned._session

      cloned.pauseSession()

      expect(cloned._session).toBeNull()

      // as there is a paused session, resumeSession should NOT clone again
      const resumeSessionClient = cloned.resumeSession()

      expect(cloned._session).toBe(expectedSession)
      expect(resumeSessionClient).toBe(cloned)
    })

    it('clones the client with resumeSession if there is no active session', () => {
      const client = createClient(serverPlugin)
      const cloned = client.resumeSession()

      expect(cloned).not.toBe(client)
      expect(cloned._session).toBeInstanceOf(Session)
      expect(client._session).toBeNull()
    })
  })
})

function createClient (serverPlugin: string | null = null) {
  const plugins: Plugin[] = [BugsnagPluginAwsLambdaSession]

  if (serverPlugin) {
    plugins.push({ name: serverPlugin, load: () => true })
  }

  return new Client({ apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', plugins })
}
