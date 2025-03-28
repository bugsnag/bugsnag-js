import Client from '../client'
import { Config } from '../common'
import assign from './es-utils/assign'

interface InternalClient {
  _config: Client['_config']
  _context: Client['_context']
  _breadcrumbs: Client['_breadcrumbs']
  _metadata: Client['_metadata']
  _features: Client['_features']
  _featuresIndex: Client['_featuresIndex']
  _user: Client['_user']
  _logger: Client['_logger']
  _delivery: Client['_delivery']
  _sessionDelegate: Client['_sessionDelegate']
  _cbs: Client['_cbs']
}

type OnCloneCallback = (client: Client) => void
const onCloneCallbacks: Array<OnCloneCallback> = []

const cloneClient = <T extends Config = Config>(client: Client<T>): Client<T> => {
  // @ts-expect-error overwriting properties manually so do not need to match constructor signature
  const clone: InternalClient = new client.Client({}, {}, [], client.getNotifier())

  clone._config = client._config

  // changes to these properties should not be reflected in the original client,
  // so ensure they are are (shallow) cloned
  clone._breadcrumbs = client._breadcrumbs.slice()
  clone._metadata = assign({}, client._metadata)
  clone._features = [...client._features]
  clone._featuresIndex = assign({}, client._featuresIndex)
  clone._user = assign({}, client._user)
  clone._context = client.getContext()

  clone._cbs = {
    e: client._cbs.e.slice(),
    s: client._cbs.s.slice(),
    sp: client._cbs.sp.slice(),
    b: client._cbs.b.slice()
  }

  clone._logger = client._logger
  clone._delivery = client._delivery
  clone._sessionDelegate = client._sessionDelegate

  onCloneCallbacks.forEach(callback => {
    callback(clone as unknown as Client<T>)
  })

  return clone as unknown as Client<T>
}

cloneClient.registerCallback = (callback: OnCloneCallback) => {
  onCloneCallbacks.push(callback)
}

export default cloneClient
