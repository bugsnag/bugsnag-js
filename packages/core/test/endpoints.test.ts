 const Client = require('../src/client').default

/* --------------------------------------------------------------------------
 *  Constants – keep tests self-contained
 * ------------------------------------------------------------------------ */
const HUB_PREFIX = '00000'
const HUB_NOTIFY = 'https://notify.insighthub.smartbear.com'
const HUB_SESSION = 'https://sessions.insighthub.smartbear.com'
const BUGSNAG_NOTIFY = 'https://notify.bugsnag.com'
const BUGSNAG_SESSION = 'https://sessions.bugsnag.com'
const HUB_KEY = `${HUB_PREFIX}abcdef0123456789abcdef012345`
const NORMAL_KEY = 'abcdef0123456789abcdef0123456789'

describe('endpoint selection', () => {
  describe('Client → automatic InsightHub switch', () => {
    it('swaps to InsightHub urls when apiKey starts with 00000', () => {
      const client = new Client({ apiKey: HUB_KEY })
      expect(client._config.endpoints).toEqual({
        notify: HUB_NOTIFY,
        sessions: HUB_SESSION
      })
    })

    it('keeps Bugsnag urls otherwise', () => {
      const client = new Client({ apiKey: NORMAL_KEY })
      expect(client._config.endpoints).toEqual({
        notify: BUGSNAG_NOTIFY,
        sessions: BUGSNAG_SESSION
      })
    })

    it('does **not** switch if custom endpoints are supplied', () => {
      const custom = { notify: 'https://n.example.com', sessions: 'https://s.example.com' }
      const client = new Client({ apiKey: HUB_KEY, endpoints: custom })
      expect(client._config.endpoints).toBe(custom)
    })
  })
})
