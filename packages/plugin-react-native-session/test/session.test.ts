import plugin from '../'
import { Client } from '@bugsnag/core'

describe('plugin: react native session', () => {
  it('adds missing methods and forwards calls to native client', () => {
    const NativeClient = {
      startSession: () => {},
      pauseSession: () => {},
      resumeSession: () => {}
    }

    const startSpy = jest.spyOn(NativeClient, 'startSession')
    const pauseSpy = jest.spyOn(NativeClient, 'pauseSession')
    const resumeSpy = jest.spyOn(NativeClient, 'resumeSession')

    const c = new Client({ apiKey: 'api_key', plugins: [plugin(NativeClient)] })
    c.startSession()
    expect(startSpy).toHaveBeenCalledTimes(1)
    c.pauseSession()
    expect(pauseSpy).toHaveBeenCalledTimes(1)
    c.resumeSession()
    expect(resumeSpy).toHaveBeenCalledTimes(1)
  })
})
