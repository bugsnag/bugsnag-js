import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'

const TIMEOUT = 60000
const POLL_INTERVAL = 500

// Used when no config file can be read at all. This is only ever correct when maze
// runner is reachable on the device itself (i.e. a tunnelled/local run).
const FALLBACK_ADDRESS = 'localhost:9339'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getConfigFilePath = () => {
  const configFileDir = Platform.OS === 'android' ? '/data/local/tmp' : Dirs.DocumentDir
  return `${configFileDir}/fixture_config.json`
}

// Raw contents of the config file, or null if it is not there yet.
const readConfigFile = async () => {
  const configFilePath = getConfigFilePath()

  if (!await FileSystem.exists(configFilePath)) return null

  return await FileSystem.readFile(configFilePath)
}

const addressFrom = contents => `${JSON.parse(contents).maze_address}`

// The address currently on disk, or null if there is no config file.
const readMazeRunnerAddress = async () => {
  const contents = await readConfigFile()

  return contents === null ? null : addressFrom(contents)
}

// The address for THIS session. On Android maze runner pushes the config file to
// /data/local/tmp, which is outside the app sandbox and so survives reinstalls: a
// file present when we start up may belong to a previous session, and the address
// in it may even still be serving another job. So ignore whatever is already there
// and wait for maze runner to write this session's file.
const getMazeRunnerAddress = async (timeout = TIMEOUT) => {
  const configFilePath = getConfigFilePath()
  const startTime = Date.now()
  const staleContents = await readConfigFile()

  if (staleContents !== null) {
    console.error(`[Bugsnag ConfigFileReader] ignoring config file left by a previous session: ${staleContents}`)
  }

  while (true) {
    const contents = await readConfigFile()

    if (contents !== null && contents !== staleContents) {
      console.error(`[Bugsnag ConfigFileReader] found config file at '${configFilePath}'. contents: ${contents}`)
      return addressFrom(contents)
    }

    if (Date.now() - startTime >= timeout) break

    await delay(POLL_INTERVAL)
  }

  // Nothing new arrived. A stale file is still a better guess than the fallback.
  if (staleContents !== null) {
    console.error(`[Bugsnag ConfigFileReader] no new config file at ${configFilePath}, using the existing one`)
    return addressFrom(staleContents)
  }

  console.error(`[Bugsnag ConfigFileReader] no config file found at ${configFilePath}, falling back to '${FALLBACK_ADDRESS}'`)
  return FALLBACK_ADDRESS
}

module.exports.getMazeRunnerAddress = getMazeRunnerAddress
module.exports.readMazeRunnerAddress = readMazeRunnerAddress
module.exports.FALLBACK_ADDRESS = FALLBACK_ADDRESS
