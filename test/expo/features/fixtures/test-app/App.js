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
import MetadataFeature from './app/metadata'
import ManualBreadcrumbs from './app/manual_breadcrumbs'
import DeviceFeature from './app/device'
import Sessions from './app/sessions'
import NetworkBreadcrumbs from './app/network_breadcrumbs'

const SCENARIOS = [
  'handled',
  'unhandled',
  'errorBoundary',
  'appFeature',
  'appStateBreadcrumbs',
  'userFeature',
  'consoleBreadcrumbs',
  'ignoreReport',
  'metadataFeature',
  'manualBreadcrumbs',
  'deviceFeature',
  'sessions',
  'networkBreadcrumbs'
]

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      scenario: null
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
      case 'metadataFeature':
        return (<MetadataFeature></MetadataFeature>)
      case 'manualBreadcrumbs':
        return (<ManualBreadcrumbs></ManualBreadcrumbs>)
      case 'deviceFeature':
        return (<DeviceFeature></DeviceFeature>)
      case 'sessions':
        return (<Sessions></Sessions>)
      case 'networkBreadcrumbs':
        return (<NetworkBreadcrumbs></NetworkBreadcrumbs>)
    }
    return this.renderScenarioOptions()
  }

  renderScenarioOptions() {
    return SCENARIOS.map((scenario, index) => {
      return <Button accessibilityLabel={scenario}
                     key={index}
                     title={'Scenario: ' + scenario}
                     onPress={() => {
                       this.setState({ scenario })
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
    paddingTop: '15%'
  },
  child: {
    flex: 1
  }
})
