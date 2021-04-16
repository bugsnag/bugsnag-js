# @bugsnag/plugin-electron-renderer-client-sync

This plugin interacts with the IPC layer injected to the browser environment by `@bugsnag/plugin-electron-ipc`.

The plugin runs in the renderer process and uses the IPC layer to sync state both ways by:

- Wrapping state mutator methods and propagating state changes to the main process
- Listening for client state changes from the main process and applying them to its own state

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
