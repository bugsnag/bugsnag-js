import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000
const FALLBACK_ADDRESS = 'localhost:9339'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getCandidatePaths = () => {
  if (Platform.OS === 'ios') {
    return [`${Dirs.DocumentDir}/fixture_config.json`]
  }

  return [
    `${Dirs.DocumentDir}/fixture_config.json`,
    `${Dirs.CacheDir}/fixture_config.json`,
    '/sdcard/Android/data/com.reactnative/files/fixture_config.json',
    '/storage/emulated/0/Android/data/com.reactnative/files/fixture_config.json',
    '/data/local/tmp/fixture_config.json'
  ]
}

const getMazeRunnerAddress = async (timeout = TIMEOUT) => {
  const candidatePaths = getCandidatePaths()
  const startTime = Date.now()

  while (true) {
    for (const path of candidatePaths) {
      try {
        if (await FileSystem.exists(path)) {
          const configFile = await FileSystem.readFile(path)
          console.error(`[Bugsnag ConfigFileReader] found config at '${path}': ${configFile}`)
          const config = JSON.parse(configFile)
          if (config && config.maze_address) {
            return `${config.maze_address}`
          }
        }
      } catch (err) {
        // Continue trying remaining candidate paths
      }
    }

    if (Date.now() - startTime >= timeout) break
    await delay(500)
  }

  console.error(`[Bugsnag ConfigFileReader] no config file found, falling back to '${FALLBACK_ADDRESS}'`)
  return FALLBACK_ADDRESS
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
module.exports.FALLBACK_ADDRESS = FALLBACK_ADDRESS