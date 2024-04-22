// TODO: Add back react-native-dotenv support
// import { REACT_APP_API_KEY, REACT_APP_ENDPOINT, REACT_APP_SCENARIO_NAME } from '@env'
import * as Scenarios from '../scenarios'
import { getCurrentCommand } from './CommandRunner'
import { NativeInterface } from './native'
import Bugsnag from '@bugsnag/react-native'

async function runScenario (scenarioName, apiKey, notifyEndpoint, sessionEndpoint) {
  const nativeConfig = {
    apiKey,
    autoTrackSessions: false,
    endpoints: {
      notify: notifyEndpoint,
      sessions: sessionEndpoint
    }
  }

  const jsConfig = {}

  console.log('Constructing scenario:', scenarioName)

  // create the scenario and allow it to modify the configuration
  const scenario = new Scenarios[scenarioName](nativeConfig, jsConfig)

  console.log('Starting native Bugsnag with config:', JSON.stringify(nativeConfig))

  console.log('typeof NativeInterface: ', typeof NativeInterface, NativeInterface !== null)

  // start the native client
  await NativeInterface.startBugsnag(nativeConfig)

  console.log('Starting js Bugsnag with config:', JSON.stringify(jsConfig))

  // start the js client
  Bugsnag.start(jsConfig)

  console.log('starting scenario')

  // run the scenario
  setTimeout(() => scenario.run(), 1)
}

export async function launchScenario () {
  let command

  const test = true

  if (test) {
    command = {
      action: 'run-scenario',
      scenario_name: 'AppNativeHandledScenario',
      api_key: '5127ad76bf13e61202ae2e7ac8d249a1',
      notify: 'https://notify.bugsnag.com',
      sessions: 'https://sessions.bugsnag.com'
    }
  } else {
    command = await getCurrentCommand()
  }

  switch (command.action) {
    case 'run-scenario':
      return await runScenario(
        command.scenario_name,
        command.api_key,
        command.notify,
        command.sessions
      )

    default:
      throw new Error(`Unknown action '${command.action}'`)
  }
}
