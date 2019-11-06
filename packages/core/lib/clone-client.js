module.exports = (client) => {
  const clone = new client.Client({}, {}, client._notifier)

  clone._config = client._config
  clone._context = client._context
  clone._depth = client._depth

  // changes to these properties should not be reflected in the original client,
  // so ensure they are are (shallow) cloned
  clone._breadcrumbs = client._breadcrumbs.slice()
  clone._user = { ...client._user }
  clone._metadata = { ...client._metadata }

  clone.__logger = client.__logger
  clone.__delivery = client.__delivery
  clone.__sessionDelegate = client.__sessionDelegate

  clone._plugins = client._plugins

  clone._cbs = {
    e: client._cbs.e.slice(),
    sp: client._cbs.sp.slice(),
    s: client._cbs.s.slice(),
    b: client._cbs.b.slice()
  }

  return clone
}
