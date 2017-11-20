/* global describe, it, expect */

describe('loading bugsnag via bundled <script> tag with data-autostart attribute', function () {
  it('should work', function (done) {
    var el = document.createElement('iframe')
    el.src = '/base/script-autostart/serve/index.html'

    var onmessage = function (event) {
      if (!event) return
      var data = JSON.parse(event.data)
      // console.log(data)
      expect(data.type === 'error').toBe(false)
      expect(data.error).toBeUndefined()
      expect(data.reports).toBeDefined()
      expect(data.reports[0].notifier.version).toMatch(/\d\.\d\.\d/)

      if ('addEventListener' in window) {
        window.removeEventListener('message', onmessage)
      } else {
        window.detachEvent('onmessage', onmessage)
      }

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
