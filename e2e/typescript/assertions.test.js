/* global describe, it, expect */

describe('loading bugsnag with Typescript app via <script> tag', function () {
  it('should work', function (done) {
    var el = document.createElement('iframe')
    el.src = '/base/typescript/serve/index.html'

    var onmessage = function (event) {
      if ('addEventListener' in window) {
        window.removeEventListener('message', onmessage)
      } else {
        window.detachEvent('onmessage', onmessage)
      }

      if (!event) return
      // console.log(event.data)
      var data = JSON.parse(event.data)
      // console.log(data)
      expect(data.type === 'error').toBe(false)
      expect(data.error).toBeUndefined()
      expect(data.reports).toBeDefined()
      expect(data.reports[0].notifier.version).toMatch(/\d\.\d\.\d/)

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
