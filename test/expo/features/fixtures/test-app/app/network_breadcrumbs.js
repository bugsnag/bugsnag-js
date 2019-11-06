import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { buildConfiguration } from './bugsnag'
import Bugsnag from '@bugsnag/expo'

export default class NetworkBreadcrumbs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      client: null,
      logMessage: null
    }
  }

  defaultNetworkBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    this.triggerNetworkBreadcrumbsError(
      Bugsnag.createClient(config),
      "defaultNetworkBreadcrumbsBehaviour"
    )
  }

  disabledNetworkBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = []
    this.triggerNetworkBreadcrumbsError(
      Bugsnag.createClient(config),
      "disabledNetworkBreadcrumbsBehaviour"
    )
  }

  disabledAllNetworkBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = null
    this.triggerNetworkBreadcrumbsError(
      Bugsnag.createClient(config),
      "disabledAllNetworkBreadcrumbsBehaviour"
    )
  }

  overrideNetworkBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = ["request"]
    this.triggerNetworkBreadcrumbsError(
      Bugsnag.createClient(config),
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
