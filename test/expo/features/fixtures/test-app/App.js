import React from 'react'
import { StyleSheet, View, Button, Picker } from 'react-native'
import Handled from './app/handled'
import Unhandled from './app/unhandled'
import ErrorBoundary from './app/error_boundary'
import AppFeature from './app/app'
import AppStateBreadcrumbs from './app/app_state_breadcrumbs'
import UserFeature from './app/user'
import ConsoleBreadcrumbs from './app/console_breadcrumbs'
import IgnoreReport from './app/ignore_report'
import OrientationBreadcrumbs from './app/orientation_breadcrumbs'
import ConnectivityBreadcrumbs from './app/connectivity_breadcrumbs'
import MetaDataFeature from './app/meta_data'
import ManualBreadcrumbs from './app/manual_breadcrumbs'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      scenario: null,
      scenarios: [
        '',
        'handled',
        'unhandled',
        'errorBoundary',
        'appFeature',
        'appStateBreadcrumbs',
        'userFeature',
        'consoleBreadcrumbs',
        'ignoreReport',
        'orientationBreadcrumbs',
        'connectivityBreadcrumbs',
        'metaDataFeature',
        'manualBreadcrumbs'
      ]
    }
  }

  renderScenario() {
    switch (this.state.scenario) {
      case 'handled':
        return (<Handled></Handled>)
      case 'unhandled':
        return (<Unhandled></Unhandled>)
      case 'errorBoundary':
        return (<ErrorBoundary></ErrorBoundary>)
      case 'appFeature':
        return (<AppFeature></AppFeature>)
      case 'appStateBreadcrumbs':
        return (<AppStateBreadcrumbs></AppStateBreadcrumbs>)
      case 'userFeature':
        return (<UserFeature></UserFeature>)
      case 'consoleBreadcrumbs':
        return (<ConsoleBreadcrumbs></ConsoleBreadcrumbs>)
      case 'ignoreReport':
        return (<IgnoreReport></IgnoreReport>)
      case 'orientationBreadcrumbs':
        return (<OrientationBreadcrumbs></OrientationBreadcrumbs>)
      case 'connectivityBreadcrumbs':
        return (<ConnectivityBreadcrumbs></ConnectivityBreadcrumbs>)
      case 'metaDataFeature':
        return (<MetaDataFeature></MetaDataFeature>)
      case 'manualBreadcrumbs':
        return (<ManualBreadcrumbs></ManualBreadcrumbs>)
    }
    return this.renderScenarioOptions()
  }

  renderScenarioOptions() {
    return this.state.scenarios.map((scenario, index) => {

      return <Button accessibilityLabel={scenario}
                     key={index}
                     title={'Scenario: ' + scenario}
                     onPress={() => {
                       this.setState(previous => (
                         {
                           scenario:scenario,
                           scenarios: previous.scenarios
                         }
                       ))
                     }}/>
    })
  }

  render () {
    return (
      <View style={styles.container}>
        <View style={styles.child}>
          { this.renderScenario() }
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  child: {
    flex: 1
  }
})
