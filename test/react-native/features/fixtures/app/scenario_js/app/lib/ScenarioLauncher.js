import * as Scenarios from '../Scenarios'
import { getCurrentCommand } from './CommandRunner'
import { NativeModules } from 'react-native'
import Bugsnag from '@bugsnag/react-native'

async function runScenario (scenarioName, apiKey, notifyEndpoint, sessionEndpoint, scenarioData) {
  console.log('ScenarioLauncher.runScenario')
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
  const scenario = new Scenarios[scenarioName](nativeConfig, jsConfig, scenarioData)

  console.log('Starting native Bugsnag with config:', JSON.stringify(nativeConfig))

  // clear persistent data
  NativeModules.BugsnagTestInterface.clearPersistentData()

  // start the native client
  await NativeModules.BugsnagTestInterface.startBugsnag(nativeConfig)

  console.log('Starting js Bugsnag with config:', JSON.stringify(jsConfig))

  // start the js client
  Bugsnag.start(jsConfig)

  console.log('starting scenario')

  // run the scenario
  setTimeout(() => scenario.run(), 1)
}

async function startBugsnag (scenarioName, apiKey, notifyEndpoint, sessionEndpoint, scenarioData) {
  console.log('ScenarioLauncher.startBugsnag')
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
  const scenario = new Scenarios[scenarioName](nativeConfig, jsConfig, scenarioData)

  console.log('Starting native Bugsnag with config:', JSON.stringify(nativeConfig))

  // start the native client
  await NativeModules.BugsnagTestInterface.startBugsnag(nativeConfig)

  console.log('Starting js Bugsnag with config:', JSON.stringify(jsConfig))

  // start the js client
  Bugsnag.start(jsConfig)
}

export async function launchScenario () {
  const command = await getCurrentCommand()

  switch (command.action) {
    case 'run-scenario':
      return await runScenario(
        command.scenario_name,
        command.api_key,
        command.notify,
        command.sessions,
        command.scenario_data
      )

    case 'start-bugsnag':
      return await startBugsnag(
        command.scenario_name,
        command.api_key,
        command.notify,
        command.sessions,
        command.scenario_data
      )

    default:
      throw new Error(`Unknown action '${command.action}'`)
  }
}
