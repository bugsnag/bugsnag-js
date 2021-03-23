interface ProcessVersions {
  node: string
  chrome: string
  electron: string
}

interface ProcessOptions {
  total?: number
  free?: number
  versions?: ProcessVersions
  platform?: string
  osVersion?: string
  mas?: boolean
  windowsStore?: boolean
  creationTime?: number|null
}

export function makeProcess ({
  total = 100, // this is in KiB to match Electron's API
  free = 25, // this is in KiB to match Electron's API
  platform = 'serenity',
  osVersion = '10.20.30',
  versions = {
    node: '1.1.1',
    chrome: '22.22.22',
    electron: '333.333.333'
  },
  mas = false,
  windowsStore = false,
  creationTime = Date.now()
}: ProcessOptions = {}) {
  return {
    getSystemMemoryInfo: () => ({ total, free }),
    getSystemVersion: () => osVersion,
    versions,
    platform,
    mas,
    windowsStore,
    getCreationTime: () => creationTime
  }
}
