{
  "targets": [
    {
      "target_name": "bugsnag_pea_bindings",
      "sources": [
        "src/api.c",
        "src/get_version.h",
      ],
      'conditions': [
        ['OS == "linux"', {"sources": ["src/get_version-linux.c"]}],
        ['OS == "mac"', {
          "sources": ["src/get_version-mac.m"],
          "libraries": [
            "-framework Foundation",
          ]
        }],
        ['OS == "win"', {
          "sources": ["src/get_version-win.c"],
          "libraries": [
            "-lkernel32.lib",
            "-lversion.lib",
          ]
        }],
      ],
    }
  ]
}
