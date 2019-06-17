import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints } from './bugsnag'
import bugsnag from '@bugsnag/expo'

export default class NetworkBreadcrumbs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      client: null,
      logMessage: null
    }
  }

  defaultNetworkBreadcrumbsBehaviour = () => {
    this.triggerNetworkBreadcrumbsError(
      bugsnag({
        endpoints: endpoints,
        autoNotify: false,
        autoCaptureSessions: false
      }),
      "defaultNetworkBreadcrumbsBehaviour"
    )
  }

  disabledNetworkBreadcrumbsBehaviour = () => {
    this.triggerNetworkBreadcrumbsError(
      bugsnag({
        endpoints: endpoints,
        autoNotify: false,
        autoCaptureSessions: false,
        networkBreadcrumbsEnabled: false
      }),
      "disabledNetworkBreadcrumbsBehaviour"
    )
  }

  disabledAllNetworkBreadcrumbsBehaviour = () => {
    this.triggerNetworkBreadcrumbsError(
      bugsnag({
        endpoints: endpoints,
        autoNotify: false,
        autoCaptureSessions: false,
        autoBreadcrumbs: false
      }),
      "disabledAllNetworkBreadcrumbsBehaviour"
    )
  }

  overrideNetworkBreadcrumbsBehaviour = () => {
    this.triggerNetworkBreadcrumbsError(
      bugsnag({
        endpoints: endpoints,
        autoNotify: false,
        autoCaptureSessions: false,
        autoBreadcrumbs: false,
        networkBreadcrumbsEnabled: true
      }),
      "overrideNetworkBreadcrumbsBehaviour"
    )
  }

  async triggerNetworkBreadcrumbsError(client, message) {
    await fetch("http://postman-echo.com/get")
      .then(response => {
        client.notify(new Error(message))
      })
      .catch(error => {
        client.notify(error)
      })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="defaultNetworkBreadcrumbsBehaviourButton"
          title="defaultNetworkBreadcrumbsBehaviour"
          onPress={this.defaultNetworkBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="disabledNetworkBreadcrumbsBehaviourButton"
          title="disabledNetworkBreadcrumbsBehaviour"
          onPress={this.disabledNetworkBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="overrideNetworkBreadcrumbsBehaviourButton"
          title="overrideNetworkBreadcrumbsBehaviour"
          onPress={this.overrideNetworkBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="disabledAllNetworkBreadcrumbsBehaviourButton"
          title="disabledAllNetworkBreadcrumbsBehaviour"
          onPress={this.disabledAllNetworkBreadcrumbsBehaviour}
        />
      </View>
    )
  }
}