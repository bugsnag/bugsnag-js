const { reduce } = require('../../base/lib/es-utils')

module.exports = {
  init: (client) => {
    let html = ''
    let DOMContentLoaded = false
    const getHtml = () => document.documentElement.outerHTML

    const addInlineContent = report => {
      const frame = report.stacktrace[0]
      if (!frame || !frame.file || !frame.lineNumber) return frame
      if (frame.file.replace(/#.*$/) !== window.location.href.replace(/#.*$/)) return frame
      if (!DOMContentLoaded || !html) html = getHtml()
      const htmlLines = [ '<!-- DOCUMENT START -->' ].concat(html.split('\n'))
      const { script, start } = extractScriptContent(htmlLines, frame.lineNumber - 1)
      const code = reduce(script, (accum, line, i) => {
        if (Math.abs((start + i + 1) - frame.lineNumber) > 10) return accum
        accum[`${start + i + 1}`] = line
        return accum
      }, {})
      frame.code = code
      report.updateMetaData('script', { content: script.join('\n') })
    }

    // get whatever HTML exists at this point in time
    html = getHtml()

    // then update it when the DOM content has loaded
    document.onreadystatechange = () => {
      // IE8 compatible alternative to document#DOMContentLoaded
      if (document.readyState === 'interactive') {
        html = getHtml()
        DOMContentLoaded = true
      }
    }

    client.config.beforeSend.unshift(addInlineContent)
  }
}

const extractScriptContent = (lines, startLine) => {
  // search down for </script>
  let line = startLine
  while (line < lines.length && !/<\/script>/.test(lines[line])) line++

  // search up for <script>
  const end = line
  while (line > 0 && !/<script.*>/.test(lines[line])) line--
  const start = line

  // strip <script> tags so that lines just contain js content
  const script = lines.slice(start, end + 1)
  script[0] = script[0].replace(/^.*<script.*>/, '')
  script[script.length - 1] = script[script.length - 1].replace(/<\/script>.*$/, '')

  // return the array of lines, and the line number the script started at
  return { script, start }
}
