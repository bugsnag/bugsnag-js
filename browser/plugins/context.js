/*
 * Sets the default context to be the current URL
 */
module.exports = {
  name: 'context',
  init: (client, BugsnagReport) => {
    // @TODO the pathname can change after the page has loaded, so potentially
    // implement this as a beforeSend() hook instead?
    client.context = window.location.pathname
  }
}
