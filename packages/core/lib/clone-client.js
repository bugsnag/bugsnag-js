module.exports = (client) => {
  const clone = new client.BugsnagClient({}, {}, client._notifier)

  // changes to these properties should be reflected in the original client
  clone._config = client._config
  clone.app = client.app
  clone.context = client.context
  clone.device = client.device

  // changes to these properties should not be reflected in the original client,
  // so ensure they are are (shallow) cloned
  clone.breadcrumbs = client.breadcrumbs.slice()
  clone.metaData = { ...client.metaData }
  clone.request = { ...client.request }
  clone._user = { ...client._user }

  clone._logger = client._logger
  clone._delivery = client._delivery

  return clone
}
