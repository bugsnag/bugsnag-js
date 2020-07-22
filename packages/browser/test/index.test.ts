import BugsnagBrowserStatic from '..'
import { Breadcrumb, Session } from '../types/bugsnag'

const API_KEY = '030bab153e7c2349be364d23b5ae93b5'
describe('browser notifier', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  function getBugsnag (): typeof BugsnagBrowserStatic {
    const Bugsnag = require('..') as typeof BugsnagBrowserStatic
    return Bugsnag
  }

  it('accepts plugins', () => {
    const Bugsnag = getBugsnag()
    Bugsnag.start({
      apiKey: API_KEY,
      plugins: [{
        name: 'foobar',
        load: client => 10
      }]
    })
    expect(Bugsnag.getPlugin('foobar')).toBe(10)
  })

  it('notifies unhandled errors', (done) => {
    const Bugsnag = getBugsnag()
    Bugsnag.start(API_KEY)
    Bugsnag.notify(new Error('123'), (event) => {
      return false
    }, (err, event) => {
      if (err) {
        done(err)
      }
      expect(event.breadcrumbs[0]).toStrictEqual(expect.objectContaining({
        type: 'navigation',
        message: 'Bugsnag loaded'
      }))
      expect(event.originalError.message).toBe('123')
      done()
    })
  })

  it('accepts all config options', (done) => {
    const Bugsnag = getBugsnag()
    Bugsnag.start({
      apiKey: API_KEY,
      appVersion: '1.2.3',
      appType: 'worker',
      autoDetectErrors: true,
      enabledErrorTypes: {
        unhandledExceptions: true,
        unhandledRejections: true
      },
      onError: [
        event => true
      ],
      onBreadcrumb: (b: Breadcrumb) => {
        return false
      },
      onSession: (s: Session) => {
        return true
      },
      endpoints: { notify: 'https://notify.bugsnag.com', sessions: 'https://sessions.bugsnag.com' },
      autoTrackSessions: true,
      enabledReleaseStages: ['zzz'],
      releaseStage: 'production',
      maxBreadcrumbs: 20,
      enabledBreadcrumbTypes: ['manual', 'log', 'request'],
      user: null,
      metadata: {},
      logger: undefined,
      redactedKeys: ['foo', /bar/],
      collectUserIp: true,
      maxEvents: 10
    })

    Bugsnag.notify(new Error('123'), (event) => {
      return false
    }, (err, event) => {
      if (err) {
        done(err)
      }
      expect(event.breadcrumbs.length).toBe(0)
      expect(event.originalError.message).toBe('123')
      done()
    })
  })
})
