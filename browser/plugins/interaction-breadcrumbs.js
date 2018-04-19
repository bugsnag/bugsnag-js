/*
 * Leaves breadcrumbs when the user interacts with the DOM
 */
module.exports = {
  init: (client) => {
    if (!('addEventListener' in window)) return

    window.addEventListener('click', (event) => {
      let targetText, targetSelector
      try {
        targetText = getNodeText(event.target)
        targetSelector = getNodeSelector(event.target)
      } catch (e) {
        targetText = '[hidden]'
        targetSelector = '[hidden]'
        client._logger.error('Cross domain error when tracking click event. See https://docs.bugsnag.com/platforms/browsers/faq/#3-cross-origin-script-errors')
      }
      client.leaveBreadcrumb('UI click', { targetText, targetSelector }, 'user')
    }, true)
  },
  configSchema: {
    interactionBreadcrumbsEnabled: {
      defaultValue: () => undefined,
      validate: (value) => value === true || value === false || value === undefined,
      message: 'should be true|false'
    }
  }
}

// extract text content from a element
const getNodeText = el => {
  let text = el.textContent || el.innerText || ''
  if (!text && (el.type === 'submit' || el.type === 'button')) text = el.value
  text = text.replace(/^\s+|\s+$/g, '') // trim whitespace
  return truncate(text, 140)
}

// Create a label from tagname, id and css class of the element
function getNodeSelector (el) {
  const parts = [ el.tagName ]
  if (el.id) parts.push('#' + el.id)
  if (el.className && el.className.length) parts.push(`.${el.className.split(' ').join('.')}`)
  // Can't get much more advanced with the current browser
  if (!document.querySelectorAll || !Array.prototype.indexOf) return parts.join('')
  try {
    if (document.querySelectorAll(parts.join('')).length === 1) return parts.join('')
  } catch (e) {
    // Sometimes the query selector can be invalid just return it as-is
    return parts.join('')
  }
  // try to get a more specific selector if this one matches more than one element
  if (el.parentNode.childNodes.length > 1) {
    const index = Array.prototype.indexOf.call(el.parentNode.childNodes, el) + 1
    parts.push(`:nth-child(${index})`)
  }
  if (document.querySelectorAll(parts.join('')).length === 1) return parts.join('')
  // try prepending the parent node selector
  if (el.parentNode) return `${getNodeSelector(el.parentNode)} > ${parts.join('')}`
  return parts.join('')
}

function truncate (value, length) {
  const ommision = '(...)'
  if (value && value.length <= length) return value
  return value.slice(0, length - ommision.length) + ommision
}
