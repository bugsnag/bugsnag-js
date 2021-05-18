# @bugsnag/plugin-client-state-manager

This plugin provides a wrapper around the parts of state that need to be synchronised, providing a way for listeners to be notified of changes.

The plugin runs in the main Electron process, and patches each of the client mutators whose state we need to synchronise:

 - `setUser()`
 - `setContext()`
 - `addMetadata()`
 - `clearMetadata()`

Any call to these methods (which will be from a developer or a plugin calling `Bugsnag.<method>()` in the main process) will emit an event signifying the change and updated value.

Separately, we expose a `bulkUpdate` method for a new renderer to deliver a full state update in one pass.

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
