if (global.window === undefined) {
  global.window = global
}

// trick the notifier in thinking it's not running in the remote debugger
global.nativeCallSyncHook = () => {}

// Fix for react-test-renderer causing tests to hang, see https://github.com/facebook/react/issues/20756#issuecomment-780927519
delete global.MessageChannel;