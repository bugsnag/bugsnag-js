import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints } from './bugsnag'
import bugsnag from '@bugsnag/expo'

export default class OrientationBreadcrumbs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      client: null,
      errorMessage: null
    }
  }

  defaultOrientationBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: bugsnag({
          apiKey: 'MyApiKey',
          endpoints: endpoints,
          autoNotify: false,
          autoCaptureSessions: false
        }),
        errorMessage: "defaultOrientationBreadcrumbsBehaviour"
      }
    ))
  }

  disabledOrientationBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: bugsnag({
          apiKey: 'MyApiKey',
          endpoints: endpoints,
          autoNotify: false,
          autoCaptureSessions: false,
          orientationBreadcrumbsEnabled: false
        }),
        errorMessage: "disabledOrientationBreadcrumbsBehaviour"
      }
    ))
  }

  overrideOrientationBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: bugsnag({
          apiKey: 'MyApiKey',
          endpoints: endpoints,
          autoNotify: false,
          autoCaptureSessions: false,
          autoBreadcrumbs: false,
          orientationBreadcrumbsEnabled: true
        }),
        errorMessage: "overrideOrientationBreadcrumbsBehaviour"
      }
    ))
  }

  triggerOrientationBreadcrumbsError = () => {
    if (this.state.client) {
      this.state.client.notify(new Error(this.state.errorMessage))
    }
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="defaultOrientationBreadcrumbsBehaviourButton"
          title="defaultOrientationBreadcrumbsBehaviour"
          onPress={this.defaultOrientationBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="disabledOrientationBreadcrumbsBehaviourButton"
          title="disabledOrientationBreadcrumbsBehaviour"
          onPress={this.disabledOrientationBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="overrideOrientationBreadcrumbsBehaviourButton"
          title="overrideOrientationBreadcrumbsBehaviour"
          onPress={this.overrideOrientationBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="triggerOrientationBreadcrumbsErrorButton"
          title="triggerOrientationBreadcrumbsError"
          onPress={this.triggerOrientationBreadcrumbsError}
        />
      </View>
    )
  }
}