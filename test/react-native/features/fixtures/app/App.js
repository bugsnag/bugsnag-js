import React, {Component} from 'react';
import Bugsnag from '@bugsnag/react-native';
import Scenarios from './Scenarios';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  NativeModules
} from 'react-native';

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentScenario: "",
      scenarioMetaData: ""
    }
  }

  setScenario = newScenario => {
    this.setState(() => (
      {
        currentScenario: newScenario
      }
    ))
  }

  setScenarioMetaData = newScenarioMetaData => {
    this.setState(() => (
      {
        scenarioMetaData: newScenarioMetaData
      }
    ))
  }

  startScenario = () => {
    console.log("Running scenario: " + this.state.currentScenario)
    console.log("  with MetaData: " + this.state.scenarioMetaData)
    let scenarioName = this.state.currentScenario
    let scenarioMetaData = this.state.scenarioMetaData
    let configuration = {
      apiKey: "12312312312312312312312312312312",
      endpoint: "http://bs-local.com:9339",
      autoTrackSessions: false
    }
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData)
    NativeModules.BugsnagTestInterface.startBugsnag(configuration, () => {
      Bugsnag.start()
      scenario.run()
    })
  }

  startScenario = () => {
    console.log("Starting Bugsnag for scenario: " + this.state.currentScenario)
    console.log("  with MetaData: " + this.state.scenarioMetaData)
    let scenarioName = this.state.currentScenario
    let scenarioMetaData = this.state.scenarioMetaData
    let configuration = {
      apiKey: "12312312312312312312312312312312",
      endpoint: "http://192.168.1.68:62000",
      autoTrackSessions: false
    }
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData)
    NativeModules.BugsnagTestInterface.startBugsnag(configuration, () => {
      Bugsnag.start()
    })
  }

  render () {
    return (
      <View style={styles.container}>
        <View style={styles.child}>
          <Text>React-native end-to-end test app</Text>
          <TextInput style={styles.textInput}
            accessibilityLabel="scenarioInput"
            onChangeText={this.setScenario} />
          <TextInput style={styles.textInput}
            accessibilityLabel="scenarioMetaDataInput"
            onChangeText={this.setScenarioMetaData} />
          <Button style={styles.clickyButton}
            accessibilityLabel="startScenarioButton"
            title="Start scenario"
            onPress={this.startScenario}/>
          <Button style={styles.clickyButton}
            accessibilityLabel="startBugsnagButton"
            title="Start Bugsnag"
            onPress={this.startBugsnag}/>
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
