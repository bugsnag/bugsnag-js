const { describe, it, expect, spyOn } = global

const plugin = require('../')
const Client = require('@bugsnag/core/client')

describe('plugin: react native session', () => {
  it('adds missing methods and forwards calls to native client', () => {
    const NativeClient = {
      startSession: () => {},
      pauseSession: () => {},
      resumeSession: () => {}
    }

    const startSpy = spyOn(NativeClient, 'startSession')
    const pauseSpy = spyOn(NativeClient, 'pauseSession')
    const resumeSpy = spyOn(NativeClient, 'resumeSession')

    const c = new Client({ apiKey: 'api_key', plugins: [plugin(NativeClient)] })
    c.startSession()
    expect(startSpy).toHaveBeenCalledTimes(1)
    c.pauseSession()
    expect(pauseSpy).toHaveBeenCalledTimes(1)
    c.resumeSession()
    expect(resumeSpy).toHaveBeenCalledTimes(1)
  })
})
