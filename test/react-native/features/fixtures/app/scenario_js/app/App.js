import React, { useState } from 'react'
import Bugsnag from '@bugsnag/react-native'
import * as Scenarios from './Scenarios'
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  NativeModules
} from 'react-native'

const App = () => {
  const [currentScenario, setScenario] = useState('')
  const [scenarioMetaData, setScenarioMetaData] = useState('')
  const [apiKey, setApiKey] = useState('12312312312312312312312312312312')
  const [notifyEndpoint, setNotifyEndpoint] = useState('http://bs-local.com:9339/notify')
  const [sessionsEndpoint, setSessionsEndpoint] = useState('http://bs-local.com:9339/sessions')

  const getConfiguration = () => {
    return {
      apiKey: apiKey,
      endpoints: {
        notify: notifyEndpoint,
        sessions: sessionsEndpoint
      },
      autoTrackSessions: false
    }
  }

  const useRealEndpoints = () => {
    setNotifyEndpoint('https://notify.bugsnag.com')
    setSessionsEndpoint('https://sessions.bugsnag.com')
  }

  const runScenario = () => {
    console.log(`Running scenario: ${currentScenario}`)
    console.log(` with MetaData: ${scenarioMetaData}`)
    const configuration = getConfiguration()
    const jsConfig = {}
    const scenario = new Scenarios[currentScenario](configuration, jsConfig, scenarioMetaData)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)
    scenario.run()
  }

  const startBugsnag = () => {
    console.log(`Starting Bugsnag for scenario: ${currentScenario}`)
    console.log(` with MetaData: ${scenarioMetaData}`)
    const configuration = getConfiguration()

    const jsConfig = {}
    // eslint-disable-next-line no-new
    new Scenarios[currentScenario](configuration, jsConfig, scenarioMetaData)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)

    NativeModules.BugsnagTestInterface.startBugsnag(configuration)
    Bugsnag.start(jsConfig)
  }

  return (
    <View style={styles.container}>
      <View style={styles.child}>
        <Text>React-native end-to-end test app</Text>
        <TextInput style={styles.textInput}
          placeholder='Scenario Name'
          accessibilityLabel='scenario_name'
          onChangeText={setScenario}/>
        <TextInput style={styles.textInput}
          placeholder='Scenario Metadata'
          accessibilityLabel='scenario_metadata'
          onChangeText={setScenarioMetaData}/>

        <Button style={styles.clickyButton}
          accessibilityLabel='start_bugsnag'
          title='Start Bugsnag'
          onPress={startBugsnag}/>
        <Button style={styles.clickyButton}
          accessibilityLabel='run_scenario'
          title='Run scenario'
          onPress={runScenario}/>

        <Text>Configuration</Text>
        <TextInput placeholder='Notify endpoint'
          style={styles.textInput}
          accessibilityLabel='notify_endpoint'
          value={notifyEndpoint}
          onChangeText={setNotifyEndpoint}/>
        <TextInput placeholder='Sessions endpoint'
          style={styles.textInput}
          accessibilityLabel='sessions_endpoint'
          value={sessionsEndpoint}
          onChangeText={setSessionsEndpoint}/>
        <TextInput placeholder='API key'
          style={styles.textInput}
          accessibilityLabel='api_key'
          value={apiKey}
          onChangeText={setApiKey}/>
        <Button style={styles.clickyButton}
          accessibilityLabel='use_dashboard_endpoints'
          title='Use dashboard endpoints'
          onPress={useRealEndpoints}/>
      </View>
    </View>
  )
}

export default App

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#eaefea',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '15%'
  },
  child: {
    flex: 1
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#000',
    borderRadius: 4,
    margin: 5,
    padding: 5
  },
  clickyButton: {
    backgroundColor: '#acbcef',
    borderWidth: 0.5,
    borderColor: '#000',
    borderRadius: 4,
    margin: 5,
    padding: 5
  }
})
