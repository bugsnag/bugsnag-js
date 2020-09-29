import React, {Component} from 'react'
import Bugsnag from '@bugsnag/react-native'
import BugsnagPluginReactNavigation from '@bugsnag/plugin-react-navigation';
import {NavigationContainer} from '@react-navigation/native';
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

const defaultJsConfig = () => ({
  plugins: [new BugsnagPluginReactNavigation()]
})

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentScenario: '',
      scenarioMetaData: '',
      manualApiKey: null,
      scenario: null
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

  startScenario = () => {
    console.log(`Running scenario: ${this.state.currentScenario}`)
    console.log(`  with MetaData: ${this.state.scenarioMetaData}`)
    let scenarioName = this.state.currentScenario
    let scenarioMetaData = this.state.scenarioMetaData
    let configuration = getDefaultConfiguration()
    let jsConfig = defaultJsConfig()
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)
    NativeModules.BugsnagTestInterface.startBugsnag(configuration, () => {
      Bugsnag.start(jsConfig)
      this.setState({ scenario })
      scenario.run()
    })
  }

  startBugsnag = () => {
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
    let jsConfig = defaultJsConfig()
    let scenario = new Scenarios[scenarioName](configuration, scenarioMetaData, jsConfig)
    console.log(`  with config: ${JSON.stringify(configuration)} (native) and ${JSON.stringify(jsConfig)} (js)`)
    NativeModules.BugsnagTestInterface.startBugsnag(configuration, () => {
      Bugsnag.start(jsConfig)
      this.setState({ ready: true, scenario })
    })
  }

  waiting () {
    return (
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
    )
  }

  ready () {
    const BugsnagNavigationContainer = Bugsnag.getPlugin('reactNavigation').createNavigationContainer(NavigationContainer);
    return (
      <BugsnagNavigationContainer>
        {this.state.scenario.view()}
      </BugsnagNavigationContainer>
    );
  }

  render () {
    return (
      <View style={styles.container}>
        <View style={styles.child}>
          <Text>React-native end-to-end test app</Text>
          {this.state.scenario
            ? this.ready()
            : this.waiting()
          }
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


// import React, {Component} from 'react';
// import {View, Text, Button, NativeModules} from 'react-native';
// import {NavigationContainer} from '@react-navigation/native';
// import {createStackNavigator} from '@react-navigation/stack';
// import Bugsnag from '@bugsnag/react-native';
// import BugsnagReactNavigation from '@bugsnag/plugin-react-navigation';

// function HomeScreen({navigation}) {
//   return (
//     <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
//       <Text>Home Screen</Text>
//       <Button title='Navigate'
//         accessibilityLabel='navigate'
//         onPress={() => navigation.navigate('Details')} />
//       <Button title='Notify handled error'
//         accessibilityLabel='sendHandled'
//         onPress={() => Bugsnag.notify(new Error('HomeNavigationError'))} />
//       <Button title='Set context'
//         accessibilityLabel='setContext'
//         onPress={() => Bugsnag.setContext('homeSetContext')} />
//     </View>
//   );
// }

// function DetailsScreen({navigation}) {
//   return (
//     <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
//       <Text>Details Screen</Text>
//       <Button title='Navigate'
//         accessibilityLabel='navigate'
//         onPress={() => navigation.navigate('Home')} />
//       <Button title='Notify handled error'
//         accessibilityLabel='sendHandled'
//         onPress={() => Bugsnag.notify(new Error('DetailsNavigationError'))} />
//       <Button title='Set context'
//         accessibilityLabel='setContext'
//         onPress={() => Bugsnag.setContext('detailsSetContext')} />
//     </View>
//   );
// }



// export default class App extends Component {

//   constructor(props) {
//     super(props)
//     this.state = {
//       showNav: false
//     }
//     NativeModules.BugsnagTestInterface.startBugsnag({
//       apiKey: '12312312312312312312312312312312',
//       endpoint: 'http://bs-local.com:9339',
//       autoTrackSessions: false
//     }, () => {
//       Bugsnag.start({
//         plugins: [new BugsnagReactNavigation()],
//       })
//       console.log("Started")
//       this.setState(() => ({showNav: true}))
//     })
//   }

//   render () {
//     if (this.state.showNav) {
//       const Stack = createStackNavigator();
//       const BugsnagNavigationContainer = Bugsnag.getPlugin('reactNavigation').createNavigationContainer(NavigationContainer);
//       return (
//         <BugsnagNavigationContainer>
//           <Stack.Navigator>
//             <Stack.Screen
//               name="Home"
//               component={HomeScreen}
//             />
//             <Stack.Screen
//               name="Details"
//               component={DetailsScreen}
//             />
//           </Stack.Navigator>
//         </BugsnagNavigationContainer>
//       );
//     } else {
//       return (
//         <Text>Waiting</Text>
//       )
//     }
//   }
// }

