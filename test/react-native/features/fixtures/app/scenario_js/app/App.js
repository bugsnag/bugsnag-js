import React, {Component} from 'react'
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

let getDefaultConfiguration = () => { return {
    apiKey: '12312312312312312312312312312312',
    endpoint: 'http://bs-local.com:9339',
    autoTrackSessions: false
  }
}

let getManualModeConfiguration = (apiKey) => { return {
  apiKey: apiKey,
  endpoints: {
    notify: 'https://notify.bugsnag.com',
    sessions: 'https://sessions.bugsnag.com'
  },
  autoTrackSessions: false
}
}

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentScenario: '',
      scenarioMetaData: '',
      manualApiKey: null
    }
    console.log(`Available scenarios:\n  ${Object.keys(Scenarios).join('\n  ')}`)
  }

  setScenario = newScenario => {
    this.setState(() => ({ currentScenario: newScenario }))
  }

  setScenarioMetaData = newScenarioMetaData => {
    this.setState(() => ({ scenarioMetaData: newScenarioMetaData }))
  }

  setManualApiKey = newApiKey => {
    this.setState(() => ({ manualApiKey: newApiKey }))
  }

  startScenario = async () => {
    console.log(`Running scenario: ${this.state.currentScenario}`)
    console.log(`  with MetaData: ${this.state.scenarioMetaData}`)
    let scenarioName = this.state.currentScenario
    let scenarioMetaData = this.state.scenarioMetaData
    let configuration = getDefaultConfiguration()
    let jsConfig = {}
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)
    await NativeModules.BugsnagTestInterface.startBugsnag(configuration)
    Bugsnag.start(jsConfig)
    scenario.run()
  }

  startBugsnag = async () => {
    console.log(`Starting Bugsnag for scenario: ${this.state.currentScenario}`)
    console.log(`  with MetaData: ${this.state.scenarioMetaData}`)
    let scenarioName = this.state.currentScenario
    let scenarioMetaData = this.state.scenarioMetaData
    let configuration
    if (this.state.manualApiKey) {
      configuration = getManualModeConfiguration(this.state.manualApiKey)
    }
    else {
      configuration = getDefaultConfiguration()
    }
    let jsConfig = {}
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
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
                     accessibilityLabel='scenarioInput'
                     onChangeText={this.setScenario} />
          <TextInput style={styles.textInput}
                     placeholder='Scenario Metadata'
                     accessibilityLabel='scenarioMetaDataInput'
                     onChangeText={this.setScenarioMetaData} />

          <Button style={styles.clickyButton}
                  accessibilityLabel='startScenarioButton'
                  title='Start scenario'
                  onPress={this.startScenario}/>
          <Button style={styles.clickyButton}
                  accessibilityLabel='startBugsnagButton'
                  title='Start Bugsnag'
                  onPress={this.startBugsnag}/>

          <Text>Manual testing mode</Text>
          <TextInput placeholder='API key'
                     style={styles.textInput}
                     onChangeText={this.setManualApiKey} />
        </View>
      </View>
    );
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
