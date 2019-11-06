import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { buildConfiguration } from './bugsnag'
import Bugsnag from '@bugsnag/expo'

export default class AppStateBreadcrumbs extends Component {
  constructor(props) {
    super(props)
    this.state = {
      client: null,
      errorMessage: null
    }
  }

  defaultAppStateBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    this.setState(() => (
      {
        client: Bugsnag.createClient(config),
        errorMessage: "defaultAppStateBreadcrumbsBehaviour"
      }
    ))
  }

  disabledAppStateBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = []
    this.setState(() => (
      {
        client: Bugsnag.createClient(config),
        errorMessage: "disabledAppStateBreadcrumbsBehaviour"
      }
    ))
  }

  disabledAllAppStateBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = []
    this.setState(() => (
      {
        client: Bugsnag.createClient(config),
        errorMessage: "disabledAllAppStateBreadcrumbsBehaviour"
      }
    ))
  }

  overrideAppStateBreadcrumbsBehaviour = () => {
    let config = buildConfiguration()
    config.autoDetectErrors = false
    config.enabledBreadcrumbTypes = ['state']
    this.setState(() => (
      {
        client: Bugsnag.createClient(config),
        errorMessage: "overrideAppStateBreadcrumbsBehaviour"
      }
    ))
  }

  triggerAppStateBreadcrumbsError = () => {
    if (this.state.client) {
      this.state.client.notify(new Error(this.state.errorMessage))
    }
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="defaultAppStateBreadcrumbsBehaviourButton"
          title="defaultAppStateBreadcrumbsBehaviour"
          onPress={this.defaultAppStateBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="disabledAppStateBreadcrumbsBehaviourButton"
          title="disabledAppStateBreadcrumbsBehaviour"
          onPress={this.disabledAppStateBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="disabledAllAppStateBreadcrumbsBehaviourButton"
          title="disabledAllAppStateBreadcrumbsBehaviour"
          onPress={this.disabledAllAppStateBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="overrideAppStateBreadcrumbsBehaviourButton"
          title="overrideAppStateBreadcrumbsBehaviour"
          onPress={this.overrideAppStateBreadcrumbsBehaviour}
        />
        <Button accessibilityLabel="triggerAppStateBreadcrumbsErrorButton"
          title="triggerAppStateBreadcrumbsError"
          onPress={this.triggerAppStateBreadcrumbsError}
        />
      </View>
    )
  }
}
