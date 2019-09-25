import React, {Component} from 'react';
import {Client, Configuration, StandardDelivery} from 'bugsnag-react-native';
import Scenarios from './Scenarios';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet
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
    let config = this.prepareBugsnagConfig()
    let scenarioName = this.state.currentScenario
    let scenarioMetaData = this.state.scenarioMetaData
    let scenario = new Scenarios[scenarioName](config, scenarioMetaData)
    let client = new Client(config)
    scenario.run(client)
  }

  startBugsnag = () => {
    console.log("Starting Bugsnag for scenario: " + this.state.currentScenario)
    console.log("  with MetaData: " + this.state.scenarioMetaData)
    let config = this.prepareBugsnagConfig()
    let scenarioName = this.state.currentScenario
    let scenarioMetaData = this.state.scenarioMetaData
    let scenario = new Scenarios[scenarioName](config, scenarioMetaData)
    let client = new Client(config)
  }

  prepareBugsnagConfig() {
    let config = new Configuration("ABCDEFGHIJKLMNOPQRSTUVWXYZ123456")
    let delivery = new StandardDelivery(
      "http://bs-local.com:9339",
      "http://bs-local.com:9339"
    )
    config.delivery = delivery
    config.autoCaptureSessions = false
    return config
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
