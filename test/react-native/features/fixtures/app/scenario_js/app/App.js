import React, { Component } from 'react'
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

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      currentScenario: '',
      scenarioMetaData: '',
      apiKey: '12312312312312312312312312312312',
      notifyEndpoint: 'http://maze-local:9339/notify',
      sessionsEndpoint: 'http://maze-local:9339/sessions'
    }
  }

  getConfiguration = () => {
    return {
      apiKey: this.state.apiKey,
      endpoints: {
        notify: this.state.notifyEndpoint,
        sessions: this.state.sessionsEndpoint
      },
      autoTrackSessions: false
    }
  }

  setScenario = newScenario => {
    this.setState(() => ({ currentScenario: newScenario }))
  }

  setScenarioMetaData = newScenarioMetaData => {
    this.setState(() => ({ scenarioMetaData: newScenarioMetaData }))
  }

  setApiKey = newApiKey => {
    this.setState(() => ({ apiKey: newApiKey }))
  }

  setNotifyEndpoint = newNotifyEndpoint => {
    this.setState(() => ({ notifyEndpoint: newNotifyEndpoint }))
  }

  setSessionsEndpoint = newSessionsEndpoint => {
    this.setState(() => ({ sessionsEndpoint: newSessionsEndpoint }))
  }

  useRealEndpoints = () => {
    this.setState({ notifyEndpoint: 'https://notify.bugsnag.com' })
    this.setState({ sessionsEndpoint: 'https://sessions.bugsnag.com' })
  }

  timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  startScenario = async () => {
    console.log(`Running scenario: ${this.state.currentScenario}`)
    console.log(`  with MetaData: ${this.state.scenarioMetaData}`)
    const scenarioName = this.state.currentScenario
    const scenarioMetaData = this.state.scenarioMetaData
    const configuration = this.getConfiguration()
    const jsConfig = {}
    const scenario = new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)
    await NativeModules.BugsnagTestInterface.startBugsnag(configuration)
    Bugsnag.start(jsConfig)
    // The notifier needs a little time to synch to the native layer, otherwise flakes occur - however it's also
    // important that the scenario waits longer than this period before relaunching the app (see the Cucumber step
    // 'I relaunch the app').
    await this.timeout(2000)
    scenario.run()
  }

  startBugsnag = async () => {
    console.log(`Starting Bugsnag for scenario: ${this.state.currentScenario}`)
    console.log(`  with MetaData: ${this.state.scenarioMetaData}`)
    const scenarioName = this.state.currentScenario
    const scenarioMetaData = this.state.scenarioMetaData
    const configuration = this.getConfiguration()

    const jsConfig = {}
    // eslint-disable-next-line no-new
    new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)
    await NativeModules.BugsnagTestInterface.startBugsnag(configuration)
    Bugsnag.start(jsConfig)
  }

  render () {
    return (
      <View style={styles.container}>
        <View style={styles.child}>
          <Text>React-native end-to-end test app</Text>
          <TextInput style={styles.textInput}
            placeholder='Scenario Name'
            accessibilityLabel='scenario_name'
            onChangeText={this.setScenario}/>
          <TextInput style={styles.textInput}
            placeholder='Scenario Metadata'
            accessibilityLabel='scenario_metadata'
            onChangeText={this.setScenarioMetaData}/>

          <Button style={styles.clickyButton}
            accessibilityLabel='start_bugsnag'
            title='Start Bugsnag only'
            onPress={this.startBugsnag}/>
          <Button style={styles.clickyButton}
            accessibilityLabel='run_scenario'
            title='Start Bugsnag and run scenario'
            onPress={this.startScenario}/>

          <Text>Configuration</Text>
          <TextInput placeholder='Notify endpoint'
            style={styles.textInput}
            accessibilityLabel='notify_endpoint'
            value={this.state.notifyEndpoint}
            onChangeText={this.setNotifyEndpoint}/>
          <TextInput placeholder='Sessions endpoint'
            style={styles.textInput}
            accessibilityLabel='sessions_endpoint'
            value={this.state.sessionsEndpoint}
            onChangeText={this.setSessionsEndpoint}/>
          <TextInput placeholder='API key'
            style={styles.textInput}
            accessibilityLabel='api_key'
            value={this.state.apiKey}
            onChangeText={this.setApiKey}/>
          <Button style={styles.clickyButton}
            accessibilityLabel='use_dashboard_endpoints'
            title='Use dashboard endpoints'
            onPress={this.useRealEndpoints}/>
        </View>
      </View>
    )
  }
};

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
