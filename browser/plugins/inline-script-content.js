const { map } = require('../../base/lib/es-utils')

module.exports = {
  init: (client) => {
    const html = document.all[0].outerHTML
    const addInlineContent = report => {
      report.stacktrace = map(report.stacktrace, frame => {
        if (!frame.file || !frame.lineNumber) return frame
        if (frame.file.replace(/#.*$/) !== window.location.href.replace(/#.*$/)) return frame
        const start = Math.max(0, frame.lineNumber - 5 - 1)
        const end = frame.lineNumber + 5 - 1
        const code = {}
        map([ '<!-- DOCUMENT START -->' ].concat(html.split('\n')).slice(start, end), (line, i) => {
          code[`${start + i + 1}`] = line
        })
        return { ...frame, code }
      })
    }

    client.config.beforeSend.push(addInlineContent)
  }
}
