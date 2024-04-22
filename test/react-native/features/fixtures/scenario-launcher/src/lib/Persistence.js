import { Dirs, FileSystem } from 'react-native-file-access'

const PERSISTED_STATE_VERSION = 1
const PERSISTED_STATE_DIRECTORY = `${Dirs.CacheDir}/bugsnag-performance-react-native/v${PERSISTED_STATE_VERSION}`
const PERSISTED_STATE_PATH = `${PERSISTED_STATE_DIRECTORY}/persisted-state.json`

async function writePersistedStateFile (contents) {
  if (!await FileSystem.exists(PERSISTED_STATE_DIRECTORY)) {
    console.error(`[BugsnagPerformance] creating persisted state directory: ${PERSISTED_STATE_DIRECTORY}`)
    await FileSystem.mkdir(PERSISTED_STATE_DIRECTORY)
  }

  console.error(`[BugsnagPerformance] writing to: ${PERSISTED_STATE_PATH}`)

  await FileSystem.writeFile(
    PERSISTED_STATE_PATH,
    JSON.stringify(contents)
  )

  console.error(`[BugsnagPerformance] finished writing to: ${PERSISTED_STATE_PATH}`)
}

export async function setSamplingProbability (value, time = Date.now()) {
  await writePersistedStateFile({
    'sampling-probability': { value, time }
  })
}

export async function setDeviceId (deviceId) {
  await writePersistedStateFile({ 'device-id': deviceId })
}

export async function clearPersistedState () {
  if (await FileSystem.exists(PERSISTED_STATE_PATH)) {
    console.error(`[BugsnagPerformance] Clearing persisted data at path: ${PERSISTED_STATE_PATH}`)
    await FileSystem.unlink(PERSISTED_STATE_PATH)
  }
}
