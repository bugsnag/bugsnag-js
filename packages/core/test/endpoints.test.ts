/* eslint-disable @typescript-eslint/no-var-requires */

const Client = require('../client')

/* --------------------------------------------------------------------------
 *  Constants – keep tests self-contained
 * ------------------------------------------------------------------------ */
const SECONDARY_ENDPOINT_API_KEY_PREFIX = '00000'
const SECONDARY_NOTIFY = 'https://notify.bugsnag.smartbear.com'
const SECONDARY_SESSION = 'https://sessions.bugsnag.smartbear.com'
const BUGSNAG_NOTIFY = 'https://notify.bugsnag.com'
const BUGSNAG_SESSION = 'https://sessions.bugsnag.com'
const PREFIXED_KEY = `${SECONDARY_ENDPOINT_API_KEY_PREFIX}abcdef0123456789abcdef012345`
const NORMAL_KEY = 'abcdef0123456789abcdef0123456789'

describe('endpoint selection', () => {
  describe('Client → automatic BugSnag switch', () => {
    it('swaps to secondary urls when apiKey starts with 00000', () => {
      const client = new Client({ apiKey: PREFIXED_KEY })
      expect(client._config.endpoints).toEqual({
        notify: SECONDARY_NOTIFY,
        sessions: SECONDARY_SESSION
      })
    })

    it('keeps default urls otherwise', () => {
      const client = new Client({ apiKey: NORMAL_KEY })
      expect(client._config.endpoints).toEqual({
        notify: BUGSNAG_NOTIFY,
        sessions: BUGSNAG_SESSION
      })
    })

    it('does **not** switch if custom endpoints are supplied', () => {
      const custom = { notify: 'https://n.example.com', sessions: 'https://s.example.com' }
      const client = new Client({ apiKey: PREFIXED_KEY, endpoints: custom })
      expect(client._config.endpoints).toBe(custom)
    })
  })
})
