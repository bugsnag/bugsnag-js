/* global describe, it, expect */

describe('using bugsnag with bluebird promises', function () {
  it('should work', function (done) {
    var el = document.createElement('iframe')
    el.src = '/base/bluebird/serve/index.html'

    var onmessage = function (event) {
      if ('addEventListener' in window) {
        window.removeEventListener('message', onmessage)
      } else {
        window.detachEvent('onmessage', onmessage)
      }

      if (!event) return
      var data = JSON.parse(event.data)
      // console.log(data)
      expect(data.type === 'error').toBe(false)
      expect(data.error).toBeUndefined()
      expect(data.reports).toBeDefined()
      expect(data.reports[0].notifier.version).toMatch(/\d\.\d\.\d/)
      // console.log(JSON.stringify(data.reports[0], null, 2))

      done()
    }

    if ('addEventListener' in window) {
      window.addEventListener('message', onmessage)
    } else {
      window.attachEvent('onmessage', onmessage)
    }

    document.body.appendChild(el)
  })
})
