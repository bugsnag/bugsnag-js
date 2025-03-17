import * as Scenarios from '../scenarios'
import { getCurrentCommand } from './CommandRunner'
import { NativeInterface } from './native'
import Bugsnag from '@bugsnag/react-native'

async function runScenario (scenarioName, apiKey, notifyEndpoint, sessionEndpoint, scenarioData, setScenario) {
  console.error(`[Bugsnag ScenarioLauncher] running scenario: ${scenarioName}`)

  const nativeConfig = {
    apiKey,
    autoTrackSessions: false,
    endpoints: {
      notify: notifyEndpoint,
      sessions: sessionEndpoint
    }
  }

  const jsConfig = {}

  // create the scenario and allow it to modify the configuration
  const scenario = new Scenarios[scenarioName](nativeConfig, jsConfig, scenarioData)

  // clear persistent data
  console.error('[Bugsnag ScenarioLauncher] clearing persistent data')
  NativeInterface.clearPersistentData()

  console.error(`[Bugsnag ScenarioLauncher] with config: ${JSON.stringify(nativeConfig)} (native) and ${JSON.stringify(jsConfig)} (js)`)

  // start the native client
  console.error('[Bugsnag ScenarioLauncher] starting native Bugsnag')
  await NativeInterface.startBugsnag(nativeConfig)

  // The calls between starting the native client and starting the js client
  // Are typically longer than we see here, so we add a delay to ensure the
  // native client is fully initialised before the js client is started
  await new Promise(resolve => setTimeout(resolve, 50))

  // start the js client
  console.error('[Bugsnag ScenarioLauncher] starting js Bugsnag')
  Bugsnag.start(jsConfig)

  // run the scenario
  console.error('launching scenario')
  setTimeout(() => {
    scenario.run()
    if (typeof scenario.view === 'function') setScenario(scenario)
  }, 1)
}

async function startBugsnag (scenarioName, apiKey, notifyEndpoint, sessionEndpoint, scenarioData) {
  console.error(`[Bugsnag ScenarioLauncher] starting Bugsnag for scenario: ${scenarioName}`)
  const nativeConfig = {
    apiKey,
    autoTrackSessions: false,
    endpoints: {
      notify: notifyEndpoint,
      sessions: sessionEndpoint
    }
  }

  const jsConfig = {}

  // create the scenario and allow it to modify the configuration
  // eslint-disable-next-line no-unused-vars
  const scenario = new Scenarios[scenarioName](nativeConfig, jsConfig, scenarioData)

  console.error(`[Bugsnag ScenarioLauncher] with config: ${JSON.stringify(nativeConfig)} (native) and ${JSON.stringify(jsConfig)} (js)`)

  // start the native client
  console.error('[Bugsnag ScenarioLauncher] starting native Bugsnag')
  await NativeInterface.startBugsnag(nativeConfig)

  // start the js client
  console.error('[Bugsnag ScenarioLauncher] starting js Bugsnag')
  Bugsnag.start(jsConfig)
}

export async function launchScenario (setScenario) {
  const command = await getCurrentCommand()

  switch (command.action) {
    case 'run-scenario':
      return await runScenario(
        command.scenario_name,
        command.api_key,
        command.notify,
        command.sessions,
        command.scenario_data,
        setScenario
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
