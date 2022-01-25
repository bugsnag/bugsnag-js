const assign = require('./es-utils/assign')

module.exports = (client) => {
  const clone = new client.Client({}, {}, [], client._notifier)

  clone._config = client._config

  // changes to these properties should not be reflected in the original client,
  // so ensure they are are (shallow) cloned
  clone._breadcrumbs = client._breadcrumbs.slice()
  clone._metadata = assign({}, client._metadata)
  clone._features = assign({}, client._features)
  clone._user = assign({}, client._user)
  clone._context = client._context

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
