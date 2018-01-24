/* global describe, it, expect */

describe('inline script content when location changes', function () {
  if (window.history.pushState) {
    it('should work', function (done) {
      var el = document.createElement('iframe')
      el.src = '/base/navigation/serve/index.html'

      var onmessage = function (event) {
        if ('addEventListener' in window) {
          window.removeEventListener('message', onmessage)
        } else {
          window.detachEvent('onmessage', onmessage)
        }

        if (!event) return
        var data = JSON.parse(event.data)
        // console.log(event.data)
        expect(data.type === 'error').toBe(false)
        expect(data.error).toBeUndefined()
        expect(data.reports).toBeDefined()
        expect(data.reports[0].notifier.version).toMatch(/\d\.\d\.\d/)
        expect(data.reports[0].events[0].metaData.script).toBeDefined()
        expect(data.reports[0].events[0].metaData.script.content.length).toBeGreaterThan(0)
        expect(data.reports[0].events[0].metaData.script.content).toBe(scriptContent)

        done()
      }

      if ('addEventListener' in window) {
        window.addEventListener('message', onmessage)
      } else {
        window.attachEvent('onmessage', onmessage)
      }

      document.body.appendChild(el)
    })
  }
})

var scriptContent = [
  '',
  '      setTimeout(function () {',
  '        try {',
  '          window.parent.postMessage(JSON.stringify({ type: \'data\', reports: reports }), \'*\')',
  '        } catch (e) {',
  '          window.parent.postMessage(JSON.stringify({ type: \'error\', error: e }), \'*\')',
  '        }',
  '      })',
  '      window.history.pushState({}, \'\', \'/234235\')',
  '      throw new Error(\'floop\')',
  '    '
].join('\n')
