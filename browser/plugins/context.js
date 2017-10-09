module.exports = {
  name: 'context',
  description: 'Sets the default context to be the current URL',
  init: (client, BugsnagReport) => {
    client.context = window.location.pathname
  }
}
