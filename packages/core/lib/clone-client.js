module.exports = (client) => {
  const clone = new client.BugsnagClient(client.notifier)
  clone.configure({})
  clone.config = client.config

  clone._internalState.extend(client._internalState)

  clone.breadcrumbs = client.breadcrumbs.slice()

  clone._logger = client._logger
  clone._delivery = client._delivery

  return clone
}
