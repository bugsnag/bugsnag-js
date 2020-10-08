/**
 * @format
 */

import {Navigation} from 'react-native-navigation';
import HomeScreen from './screens/Home';
import DetailsScreen from './screens/Details';
import {NativeModules, View, Text, Button, TextInput, StyleSheet} from 'react-native';
import * as React from 'react';
import Bugsnag from '@bugsnag/react-native';
import * as Scenarios from './Scenarios'
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation';

let getDefaultConfiguration = () => {
  return {
    apiKey: '12312312312312312312312312312312',
    endpoint: 'http://bs-local.com:9339',
    autoTrackSessions: false
  }
}

let getManualModeConfiguration = (apiKey) => { 
  return {
    apiKey: apiKey,
    endpoints: {
      notify: 'https://notify.bugsnag.com',
      sessions: 'https://sessions.bugsnag.com'
    },
    autoTrackSessions: false
  }
}

const defaultJsConfig = () => ({
  plugins: [new BugsnagReactNativeNavigation(Navigation)]
})

const AppScreen = () => {
  state = {
    currentScenario: '',
    scenarioMetaData: '',
    manualApiKey: null,
    scenario: null
  }
  console.log(`Available scenarios:\n  ${Object.keys(Scenarios).join('\n  ')}`)

  setScenario = newScenario => {
    state.currentScenario = newScenario
  }

  setScenarioMetaData = newScenarioMetaData => {
    state.scenarioMetaData = newScenarioMetaData
  }

  setManualApiKey = newApiKey => {
    setState.manualApiKey = newApiKey
  }

  startScenario = () => {
    console.log(`Running scenario: ${state.currentScenario}`)
    console.log(`  with MetaData: ${state.scenarioMetaData}`)
    let scenarioName = state.currentScenario
    let scenarioMetaData = state.scenarioMetaData
    let configuration = getDefaultConfiguration()
    let jsConfig = defaultJsConfig()
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${jsConfig} (js)`)
    NativeModules.BugsnagTestInterface.startBugsnag(configuration)
    .then(() => {
      Navigation.setRoot({
        root: {
          stack: {
            children: [
              {
                component: {
                  name: 'Home',
                },
              },
            ],
          },
        }
      })
      Bugsnag.start(jsConfig)
      state.scenario = scenario
      scenario.run()
    })
  }

  startBugsnag = () => {
    console.log(`Starting Bugsnag for scenario: ${state.currentScenario}`)
    console.log(`  with MetaData: ${state.scenarioMetaData}`)
    let scenarioName = state.currentScenario
    let scenarioMetaData = state.scenarioMetaData
    let configuration
    if (state.manualApiKey) {
      configuration = getManualModeConfiguration(state.manualApiKey)
    } else {
      configuration = getDefaultConfiguration()
    }
    let jsConfig = defaultJsConfig()
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${jsConfig} (js)`)
    NativeModules.BugsnagTestInterface.startBugsnag(configuration)
    .then(() => {
      Bugsnag.start(jsConfig)
      state.scenario = scenario
    })
  }

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
      </View>
    </View>
  )
}

Navigation.registerComponent('App', () => AppScreen)
Navigation.registerComponent('Home', () => HomeScreen);
Navigation.registerComponent('Details', () => DetailsScreen);
Navigation.events().registerAppLaunchedListener(async () => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'App',
            },
          },
        ],
      },
    },
  })
})

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
