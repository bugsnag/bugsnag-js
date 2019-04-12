import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints } from './bugsnag'
import bugsnag from '@bugsnag/expo'

export default class ConsoleBreadcrumbs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      client: null,
      logMessage: null
    }
  }

  defaultConsoleBreadcrumbsBehaviour = () => {
    this.triggerConsoleBreadcrumbsError(
      bugsnag({
        apiKey: 'MyApiKey',
        endpoints: endpoints,
        autoNotify: false,
        autoCaptureSessions: false
      }),
      "defaultConsoleBreadcrumbsBehaviour"
    )
  }

  disabledConsoleBreadcrumbsBehaviour = () => {
    this.triggerConsoleBreadcrumbsError(
      bugsnag({
        apiKey: 'MyApiKey',
        endpoints: endpoints,
        autoNotify: false,
        autoCaptureSessions: false,
        consoleBreadcrumbsEnabled: false
      }),
      "disabledConsoleBreadcrumbsBehaviour"
    )
  }

  overrideConsoleBreadcrumbsBehaviour = () => {
    this.triggerConsoleBreadcrumbsError(
      bugsnag({
        apiKey: 'MyApiKey',
        endpoints: endpoints,
        autoNotify: false,
        autoCaptureSessions: false,
        autoBreadcrumbs: false,
        consoleBreadcrumbsEnabled: true
      }),
      "overrideConsoleBreadcrumbsBehaviour"
    )
  }

  triggerConsoleBreadcrumbsError = (client, message) => {
    console.log(message)
    client.notify(new Error(message))
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="defaultConsoleBreadcrumbsBehaviourButton"
          title="defaultConsoleBreadcrumbsBehaviour"
          onPress={this.defaultConsoleBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="disabledConsoleBreadcrumbsBehaviourButton"
          title="disabledConsoleBreadcrumbsBehaviour"
          onPress={this.disabledConsoleBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="overrideConsoleBreadcrumbsBehaviourButton"
          title="overrideConsoleBreadcrumbsBehaviour"
          onPress={this.overrideConsoleBreadcrumbsBehaviour}
        />
      </View>
    )
  }
}