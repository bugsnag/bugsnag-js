import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints } from './bugsnag'
import bugsnag from '@bugsnag/expo'

export default class ConnectivityBreadcrumbs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      client: null,
      errorMessage: null
    }
  }

  defaultConnectivityBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: bugsnag({
          apiKey: 'MyApiKey',
          endpoints: endpoints,
          autoNotify: false,
          autoCaptureSessions: false
        }),
        errorMessage: "defaultConnectivityBreadcrumbsBehaviour"
      }
    ))
  }

  disabledConnectivityBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: bugsnag({
          apiKey: 'MyApiKey',
          endpoints: endpoints,
          autoNotify: false,
          autoCaptureSessions: false,
          connectivityBreadcrumbsEnabled: false
        }),
        errorMessage: "disabledConnectivityBreadcrumbsBehaviour"
      }
    ))
  }

  overrideConnectivityBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: bugsnag({
          apiKey: 'MyApiKey',
          endpoints: endpoints,
          autoNotify: false,
          autoCaptureSessions: false,
          autoBreadcrumbs: false,
          connectivityBreadcrumbsEnabled: true
        }),
        errorMessage: "overrideConnectivityBreadcrumbsBehaviour"
      }
    ))
  }

  triggerConnectivityBreadcrumbsError = () => {
    if (this.state.client) {
      this.state.client.notify(new Error(this.state.errorMessage))
    }
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="defaultConnectivityBreadcrumbsBehaviourButton"
          title="defaulConnectivityBreadcrumbsBehaviour"
          onPress={this.defaultConnectivityBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="disabledConnectivityBreadcrumbsBehaviourButton"
          title="disabledConnectivityBreadcrumbsBehaviour"
          onPress={this.disabledConnectivityBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="overrideConnectivityBreadcrumbsBehaviourButton"
          title="overrideConnectivityBreadcrumbsBehaviour"
          onPress={this.overrideConnectivityBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="triggerConnectivityBreadcrumbsErrorButton"
          title="triggerConnectivityBreadcrumbsError"
          onPress={this.triggerConnectivityBreadcrumbsError}
        />
      </View>
    )
  }
}