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
      apiKey: '12312312312312312312312312312312',
      notifyEndpoint: 'http://bs-local.com:9339/notify',
      sessionsEndpoint: 'http://bs-local.com:9339/sessions'
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

  runScenario = () => {
    console.log(`Running scenario: ${this.state.currentScenario}`)
    const scenarioName = this.state.currentScenario
    const configuration = this.getConfiguration()
    const jsConfig = {}
    const scenario = new Scenarios[scenarioName](configuration, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)
    scenario.run()
  }

  startBugsnag = () => {
    console.log(`Starting Bugsnag for scenario: ${this.state.currentScenario}`)
    const scenarioName = this.state.currentScenario
    const configuration = this.getConfiguration()

    const jsConfig = {}
    // eslint-disable-next-line no-new
    new Scenarios[scenarioName](configuration, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)

    NativeModules.BugsnagTestInterface.startBugsnag(configuration).then(() => {
      Bugsnag.start(jsConfig)
    })
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

          <Button style={styles.clickyButton}
            accessibilityLabel='start_bugsnag'
            title='Start Bugsnag'
            onPress={this.startBugsnag}/>
          <Button style={styles.clickyButton}
            accessibilityLabel='run_scenario'
            title='Run scenario'
            onPress={this.runScenario}/>

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
