import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints } from './bugsnag'
import Bugsnag from '@bugsnag/expo'

export default class ConsoleBreadcrumbs extends Component {
  defaultConsoleBreadcrumbsBehaviour = () => {
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient({
        endpoints: endpoints,
        autoDetectErrors: false,
        autoTrackSessions: false
      }),
      "defaultConsoleBreadcrumbsBehaviour"
    )
  }

  disabledConsoleBreadcrumbsBehaviour = () => {
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient({
        endpoints: endpoints,
        autoDetectErrors: false,
        autoTrackSessions: false,
        enabledBreadcrumbTypes: []
      }),
      "disabledConsoleBreadcrumbsBehaviour"
    )
  }

  disabledAllConsoleBreadcrumbsBehaviour = () => {
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient({
        endpoints: endpoints,
        autoDetectErrors: false,
        autoTrackSessions: false,
        enabledBreadcrumbTypes: null
      }),
      "disabledAllConsoleBreadcrumbsBehaviour"
    )
  }

  overrideConsoleBreadcrumbsBehaviour = () => {
    this.triggerConsoleBreadcrumbsError(
      Bugsnag.createClient({
        endpoints: endpoints,
        autoDetectErrors: false,
        autoTrackSessions: false,
        enabledBreadcrumbTypes: ["log"]
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
        <Button accessibilityLabel="disabledAllConsoleBreadcrumbsBehaviourButton"
          title="disabledAllConsoleBreadcrumbsBehaviour"
          onPress={this.disabledAllConsoleBreadcrumbsBehaviour}
        />
      </View>
    )
  }
}
