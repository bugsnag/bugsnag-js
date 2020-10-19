if (global.window === undefined) {
  global.window = global
}

// trick the notifier in thinking it's not running in the remote debugger
global.nativeCallSyncHook = () => {}
