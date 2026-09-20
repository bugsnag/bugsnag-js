import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000

// Used when no config file can be read at all. This is only ever correct when maze
// runner is reachable on the device itself (i.e. a tunnelled/local run).
const FALLBACK_ADDRESS = 'localhost:9339'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getCandidatePaths = () => {
  if (Platform.OS === 'ios') {
    return [`${Dirs.DocumentDir}/fixture_config.json`]
  }

  return [
    '/sdcard/Android/data/com.reactnative/files/fixture_config.json',
    '/storage/emulated/0/Android/data/com.reactnative/files/fixture_config.json',
    `${Dirs.SDCardDir}/Android/data/com.reactnative/files/fixture_config.json`,
    '/data/local/tmp/fixture_config.json',
    `${Dirs.SDCardDir}/fixture_config.json`,
    `${Dirs.DocumentDir}/fixture_config.json`,
    `${Dirs.CacheDir}/fixture_config.json`
  ]
}

// Reads the maze runner address that maze runner pushes to the device. Waits up to
// `timeout` ms for the file to appear; pass 0 to read whatever is on disk right now.
const getMazeRunnerAddress = async (timeout = TIMEOUT) => {
  const candidatePaths = getCandidatePaths()
  const startTime = Date.now()

  // poll for the config file to exist
  while (true) {
    for (const path of candidatePaths) {
      try {
        const configFileExists = await FileSystem.exists(path)

        if (configFileExists) {
          const configFile = await FileSystem.readFile(path)
          console.error(`[Bugsnag ConfigFileReader] found config file at '${path}'. contents: ${configFile}`)
          const config = JSON.parse(configFile)
          if (config && config.maze_address) {
            return `${config.maze_address}`
          }
        }
      } catch (err) {
        // Continue searching other candidate paths
      }
    }

    if (Date.now() - startTime >= timeout) break

    await delay(500)
  }

  console.error(`[Bugsnag ConfigFileReader] no config file found in candidate paths, falling back to '${FALLBACK_ADDRESS}'`)
  return FALLBACK_ADDRESS
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
module.exports.FALLBACK_ADDRESS = FALLBACK_ADDRESS