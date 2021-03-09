# @bugsnag/plugin-electron-ipc

This plugin implements the IPC layer which is used to synchronise data between the main and renderer processes.

The plugin itself (`electron-ipc.js`) runs in the main Electron process and does the following things:

- Sets up listeners in the main process that renderers can use to
  1. retrieve config with which to start a client
  2. propagate state changes during the lifecycle of a client
  3. mange sessions and send events
- Injects a preload script to every new renderer process, ensuring the IPC interface is available in browser windows as a global variable
- Listens for changes to client state in the main process (emitted by `@bugsnag/plugin-state-sync`) and propagates them to all renderer processes

The interface exposed to renderers is defined in `bugsnag-ipc-renderer.js`, and the class used to route events to relevant actions in the main process is defined in `bugsnag-ipc-main.js`.

All data send over the IPC layer is serialised using `@bugsnag/safe-json-stringify` for greater flexibility. Electron's default serialialisation method will throw if any complex objects are referenced, or there are any circular structures. To deserialise it is simply `JSON.parse()`d.

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
