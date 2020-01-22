const { describe, it, expect, spyOn } = global

const plugin = require('../')
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: react native session', () => {
  it('adds missing methods and forwards calls to native client', () => {
    const NativeClient = {
      startSession: () => {},
      stopSession: () => {},
      resumeSession: () => {}
    }

    const startSpy = spyOn(NativeClient, 'startSession')
    const stopSpy = spyOn(NativeClient, 'stopSession')
    const resumeSpy = spyOn(NativeClient, 'resumeSession')

    const c = new Client({ apiKey: 'api_key' })
    c.use(plugin, NativeClient)
    c.startSession()
    expect(startSpy).toHaveBeenCalledTimes(1)
    c.stopSession()
    expect(stopSpy).toHaveBeenCalledTimes(1)
    c.resumeSession()
    expect(resumeSpy).toHaveBeenCalledTimes(1)
  })
})
