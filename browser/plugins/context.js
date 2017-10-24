/*
 * Sets the default context to be the current URL
 */
module.exports = {
  name: 'context',
  init: (client, BugsnagReport) => {
    client.context = window.location.pathname
  }
}
