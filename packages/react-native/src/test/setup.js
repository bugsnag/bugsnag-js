// trick the notifier in thinking it's not running in the remote debugger
global.nativeCallSyncHook = () => {}
