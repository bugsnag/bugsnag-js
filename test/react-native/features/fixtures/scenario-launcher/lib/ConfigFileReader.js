import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000

// Used when no config file can be read at all. This is only ever correct when maze
// runner is reachable on the device itself (i.e. a tunnelled/local run).
const FALLBACK_ADDRESS = 'localhost:9339'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Reads the maze runner address that maze runner pushes to the device. Waits up to
// `timeout` ms for the file to appear; pass 0 to read whatever is on disk right now.
const getMazeRunnerAddress = async (timeout = TIMEOUT) => {
  const configFileDir = Platform.OS === 'android' ? '/data/local/tmp' : Dirs.DocumentDir
  const configFilePath = `${configFileDir}/fixture_config.json`
  const startTime = Date.now()

  // poll for the config file to exist
  while (true) {
    const configFileExists = await FileSystem.exists(configFilePath)

    if (configFileExists) {
      const configFile = await FileSystem.readFile(configFilePath)
      console.error(`[Bugsnag ConfigFileReader] found config file at '${configFilePath}'. contents: ${configFile}`)
      const config = JSON.parse(configFile)
      return `${config.maze_address}`
    }

    if (Date.now() - startTime >= timeout) break

    await delay(500)
  }

  console.error(`[Bugsnag ConfigFileReader] no config file found at ${configFilePath}, falling back to '${FALLBACK_ADDRESS}'`)
  return FALLBACK_ADDRESS
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
module.exports.FALLBACK_ADDRESS = FALLBACK_ADDRESS
