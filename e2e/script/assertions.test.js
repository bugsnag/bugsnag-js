/* global describe, it, expect */

describe('loading bugsnag via bundled <script> tag', function () {
  it('should work', function (done) {
    var el = document.createElement('iframe')
    el.src = '/base/script/serve/index.html'

    var onmessage = function (event) {
      console.log(event)
      if (!event) return
      var data = JSON.parse(event.data)
      expect(data.type === 'error').toBe(false)
      expect(data.error).toBeUndefined()
      expect(data.reports).toBeDefined()
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
