import Client from "../client";
import { Config, Logger } from "../common";
import assign from "./es-utils/assign";

interface Notifier {
  name: string;
  version: string;
  url: string;
}

interface InternalClient extends Client {
  getNotifier: Notifier;
  _logger: Logger;
  _config: Required<Config>;
  getContext: string | undefined;
  Client: typeof Client;
}

const onCloneCallbacks: Array<any> = [];

export default (client: InternalClient) => {
  // const clone = new client.Client({}, {}, [], client._notifier);
  const clone = Object.assign(Object.create(Object.getPrototypeOf(client.Client)), client.Client);

  clone._config = client._config;

  // changes to these properties should not be reflected in the original client,
  // so ensure they are are (shallow) cloned
  clone._breadcrumbs = client._breadcrumbs.slice();
  clone._metadata = assign({}, client._metadata);
  clone._features = [...client._features];
  clone._featuresIndex = assign({}, client._featuresIndex);
  clone._user = assign({}, client._user);
  clone._context = client.getContext;

  clone._cbs = {
    e: client._cbs.e.slice(),
    s: client._cbs.s.slice(),
    sp: client._cbs.sp.slice(),
    b: client._cbs.b.slice()
  };

  clone._logger = client._logger;
  clone._delivery = client._delivery;
  clone._sessionDelegate = client._sessionDelegate;

  onCloneCallbacks.forEach(callback => {
    callback(clone);
  });

  return clone;
};

export const registerCallback = (callback: () => void) => {
  onCloneCallbacks.push(callback);
};
