import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { buildConfiguration } from './bugsnag'
import Bugsnag from '@bugsnag/expo'

export default class ConsoleBreadcrumbs extends Component {
  defaultConsoleBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient(config),
      "defaultConsoleBreadcrumbsBehaviour"
    )
  }

  disabledConsoleBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = []
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient(config),
      "disabledConsoleBreadcrumbsBehaviour"
    )
  }

  disabledAllConsoleBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = null
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient(config),
      "disabledAllConsoleBreadcrumbsBehaviour"
    )
  }

  overrideConsoleBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = ['log']
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient(config),
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
        <Button accessibilityLabel="disabledAllConsoleBreadcrumbsBehaviourButton"
          title="disabledAllConsoleBreadcrumbsBehaviour"
          onPress={this.disabledAllConsoleBreadcrumbsBehaviour}
        />
      </View>
    )
  }
}
