module.exports = (client) => {
  const clone = new client.BugsnagClient(client.notifier)
  clone.configure({})

  // changes to these properties should be reflected in the original client
  clone.config = client.config
  clone.app = client.app
  clone.context = client.context
  clone.device = client.device

  // changes to these properties should not be reflected in the original client,
  // so ensure they are are (shallow) cloned
  clone.breadcrumbs = client.breadcrumbs.slice()
  clone.metaData = { ...client.metaData }
  clone.request = { ...client.request }
  clone.user = { ...client.user }

  clone.logger(client._logger)
  clone.delivery(client._delivery)

  return clone
}
