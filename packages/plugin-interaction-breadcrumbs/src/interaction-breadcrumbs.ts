import { Plugin } from '@bugsnag/core'
import type ClientWithInternals from '@bugsnag/core/client'

/*
 * Leaves breadcrumbs when the user interacts with the DOM
 */
export default (win = window): Plugin => ({
  load: (client) => {
    if (!('addEventListener' in win)) return
    if (!(client as ClientWithInternals)._isBreadcrumbTypeEnabled('user')) return

    win.addEventListener('click', (event) => {
      let targetText, targetSelector
      try {
        targetText = getNodeText(event.target)
        targetSelector = getNodeSelector(event.target, win)
      } catch (e) {
        targetText = '[hidden]'
        targetSelector = '[hidden]';
        (client as ClientWithInternals)._logger.error('Cross domain error when tracking click event. See docs: https://tinyurl.com/yy3rn63z')
      }
      client.leaveBreadcrumb('UI click', { targetText, targetSelector }, 'user')
    }, true)
  }
})

const trim = /^\s*([^\s][\s\S]{0,139}[^\s])?\s*/

// TODO: Fix Type
function getNodeText (el: any) {
  let text = el.textContent || el.innerText || ''

  if (!text && (el.type === 'submit' || el.type === 'button')) {
    text = el.value
  }

  text = text.replace(trim, '$1')

  if (text.length > 140) {
    return text.slice(0, 135) + '(...)'
  }

  return text
}

// Create a label from tagname, id and css class of the element
// TODO: Fix Type
function getNodeSelector (el: any, win: Window): string {
  const parts = [el.tagName]
  if (el.id) parts.push('#' + el.id)
  if (el.className && el.className.length) parts.push(`.${el.className.split(' ').join('.')}`)
  // Can't get much more advanced with the current browser
  if (!win.document.querySelectorAll || !Array.prototype.indexOf) return parts.join('')
  try {
    if (win.document.querySelectorAll(parts.join('')).length === 1) return parts.join('')
  } catch (e) {
    // Sometimes the query selector can be invalid just return it as-is
    return parts.join('')
  }
  // try to get a more specific selector if this one matches more than one element
  if (el.parentNode.childNodes.length > 1) {
    const index = Array.prototype.indexOf.call(el.parentNode.childNodes, el) + 1
    parts.push(`:nth-child(${index})`)
  }
  if (win.document.querySelectorAll(parts.join('')).length === 1) return parts.join('')
  // try prepending the parent node selector
  if (el.parentNode) return `${getNodeSelector(el.parentNode, win)} > ${parts.join('')}`
  return parts.join('')
}
