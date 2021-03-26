# @bugsnag/plugin-electron-state-sync

Parts of client state need to be synchronised between various client instances running in difference processes.

This plugin provides a wrapper around the parts of state that need to be synchronised, providing a way for each process to update them, and a way for each process to be notified of changes.

The plugin runs in the main Electron process, and patches each of the client mutators whose state we need to synchronise:

 - `setUser()`
 - `setContext()`
 - `addMetadata()`
 - `clearMetadata()`

Any call to these methods (which will be from a developer or a plugin calling `Bugsnag.<method>()` in the main process) will emit an event signifying the change and updated value and what the "source" of the change was (in this case the main process).

Separately, we maintain handles to the mutators to manage state changes that were initiated in renderer processes. An inbound
change from a renderer process must call `setX(args)` causing that change to be applied to the main client.

## API

```typescript
import * as EventEmitter from 'events'
import { WebContents } from 'electron'

interface BugsnagElectronStateSyncPlugin {
  name: 'stateSync'
  load: (client: BugsnagClient) => StateSyncPluginResult
}

interface StateSyncPluginResult {
  emitter: EventEmitter
  setContext: (...args: any[]) => void
  setUser: (...args: any[]) => void
  addMetadata: (...args: any[]) => void
  clearMetadata:(...args: any[]) => void
}

// Event types and payloads

type EVENT_TYPES = 'ContextUpdate' | 'UserUpdate' | 'AddMetadata' | 'ClearMetadata'

interface ContextUpdatePayload: string

interface UserUpdatePayload {
  id?: string
  email?: string
  name?: string
}

interface AddMetadataPayload {
  section: string
  values: Record<string,any> | undefined
}
```

## Usage

```js
// listening for changes
const { emitter } = client.getPlugin('stateSync')
emitter.on('ContextUpdate', (event, context) => {
  console.log(context) // the new value
})

const { setContext } = client.getPlugin('stateSync')
ipcMain.handle('<event from renderer>', (event, methodName, ...args) => {
  if (methodName === 'setContext') setContext(args[0])
  // etc.
})
client.setContext('new context')
```

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
