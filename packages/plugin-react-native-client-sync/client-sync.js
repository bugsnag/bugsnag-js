const serializeForNativeLayer = require('./native-serializer')

module.exports = {
  name: 'observedClient',
  init: (client, NativeClient) => {
    // patch breadcrumb method to sync it on the native client
    client.leaveBreadcrumb = (name, metaData, type, timestamp) => {
      const metadata = serializeForNativeLayer(metaData, client._logger)
      NativeClient.leaveBreadcrumb({ name, metadata, type, timestamp })
    }

    // constructs proxies which wrap the client and its properties so
    // that behaves the same, but we can be notified of updates
    const observeClient = client => {
      const listeners = []

      // TODO: make this watch all nested props
      const watch = (obj, prop, value) => {
        return new Proxy(value, clientPropHandler(prop))
      }

      const clientPropHandler = (name) => ({
        set: (obj, prop, value) => {
          obj[prop] = value
          updateListeners({ name: prop, value: obj[prop] })
        },
        deleteProperty: (obj, prop) => {
          delete obj[prop]
          updateListeners({ name: prop, value: obj[prop] })
        }
      })

      const updateListeners = (data) => {
        // notify the listeners of this update
        listeners.forEach(l => l(data))
      }

      const update = (client, obj, prop, value) => {
        switch (prop) {
          case 'user':
          case 'metaData':
            obj[prop] = watch(obj, prop, value)
            break
          case 'context':
            obj[prop] = value
            break
          default:
            obj[prop] = value
        }
      }

      return {
        // proxies all the observable properties so that it can be subscribed to
        observedClient: new Proxy(client, {
          set: (obj, prop, value) => {
            update(client, obj, prop, value)
            updateListeners({ name: prop, value: obj[prop] })
          },
          deleteProperty: (obj, prop) => {
            delete obj[prop]
          }
        }),

        // provides an escape-hatch for updating properties
        // without triggering circular updates
        silentlyUpdate: (prop, val) => {
          client[prop] = val
        },

        // subscribe to updates on the observed client
        subscribe: (listener) => listeners.push(listener)
      }
    }

    // make the client observable
    const { observedClient, /* silentlyUpdate, */ subscribe } = observeClient(client)
    subscribe(event => {
      NativeClient.updateClientProperty(serializeForNativeLayer({ [event.name]: event.value }, client._logger))
    })

    return observedClient
  }
}
