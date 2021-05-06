{
  "targets": [
    {
      "target_name": "bugsnag_e_bindings",
      "sources": [
        "src/native_package_version/api.c",
        "src/native_package_version/get_version.h",
      ],
      'conditions': [
        ['OS == "linux"', {"sources": ["src/native_package_version/get_version-linux.c"]}],
        ['OS == "mac"', {
          "sources": ["src/native_package_version/get_version-mac.m"],
          "libraries": [
            "-framework Foundation",
          ]
        }],
        ['OS == "win"', {
          "sources": ["src/native_package_version/get_version-win.c"],
          "libraries": [
            "-lkernel32.lib",
            "-lversion.lib",
          ]
        }],
      ],
    }
  ]
}
