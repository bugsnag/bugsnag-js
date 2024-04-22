import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getMazeRunnerAddress = async () => {
  let configFilePath
  const startTime = Date.now()

  // poll for the config file to exist
  while (Date.now() - startTime < TIMEOUT) {
    const configFileDir = Platform.OS === 'android' ? '/data/local/tmp' : Dirs.DocumentDir
    configFilePath = `${configFileDir}/fixture_config.json`
    const configFileExists = await FileSystem.exists(configFilePath)

    if (configFileExists) {
      const configFile = await FileSystem.readFile(configFilePath)
      console.error(`[BugsnagPerformance] found config file at '${configFilePath}'. contents: ${configFile}`)
      const config = JSON.parse(configFile)
      return `${config.maze_address}`
    }

    await delay(500)
  }

  console.error(`[BugsnagPerformance] no config file found at ${configFilePath}, falling back to 'localhost:9339'`)
  return 'localhost:9339'
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
