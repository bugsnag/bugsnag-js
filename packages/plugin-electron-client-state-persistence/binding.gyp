{
  "targets": [
    {
      "target_name": "bugsnag_pecsp_bindings",
      "sources": [
        "src/api.c",
        "src/bugsnag_electron_client_state_persistence.c",
        "src/deps/parson/parson.c",
        "src/deps/tinycthread/tinycthread.c"
      ],
      'conditions': [
        ['OS == "linux"', {"sources": ["src/crash_handler-posix.c"]}],
        ['OS == "mac"', {"sources": ["src/crash_handler-posix.c"]}],
        ['OS == "win"', {
          "sources": ["src/crash_handler-win.c"],
          "libraries": ["-lkernel32.lib"]
        }],
      ],
    }
  ]
}
