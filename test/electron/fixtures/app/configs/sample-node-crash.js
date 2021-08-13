if (process.platform === 'linux') {
  // we should be able to start the crash reporter here and get crash reports
  // like on other platforms, however since there is no `app` in this process,
  // generated minidumps are placed in `/tmp` instead of the configured crash
  // dumps directory. See https://github.com/electron/electron/issues/24779
  // Related:
  // https://www.electronjs.org/docs/api/crash-reporter#note-about-node-child-processes-on-linux
  return
}

process.crash()
