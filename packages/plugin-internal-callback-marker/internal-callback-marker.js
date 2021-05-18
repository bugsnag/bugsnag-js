module.exports.FirstPlugin = {
  load: (client) => {
    // patch onError so we can track which onError callbacks are added by internal plugins
    const _origAddOnError = client.addOnError
    client.addOnError = function (fn) {
      fn._internal = true
      _origAddOnError.apply(client, arguments)
    }
    client.addOnError._restore = () => {
      client.addOnError = _origAddOnError
    }
  }
}

module.exports.LastPlugin = {
  load: (client) => {
    client.addOnError._restore()
  }
}
