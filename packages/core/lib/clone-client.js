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
  clone._metadata = { ...client._metadata }
  clone._user = { ...client._user }

  clone._cbs = {
    e: client._cbs.e.slice(),
    s: client._cbs.s.slice(),
    sp: client._cbs.sp.slice(),
    b: client._cbs.b.slice()
  }

  clone._logger = client._logger
  clone._delivery = client._delivery
  clone._sessionDelegate = client._sessionDelegate

  return clone
}
