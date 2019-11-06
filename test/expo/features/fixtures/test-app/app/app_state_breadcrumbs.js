import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { endpoints } from './bugsnag'
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
    this.setState(() => (
      {
        client: Bugsnag.createClient({
          endpoints: endpoints,
          autoDetectErrors: false,
          autoTrackSessions: false
        }),
        errorMessage: "defaultAppStateBreadcrumbsBehaviour"
      }
    ))
  }

  disabledAppStateBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: Bugsnag.createClient({
          endpoints: endpoints,
          autoDetectErrors: false,
          autoTrackSessions: false,
          enabledBreadcrumbTypes: []
        }),
        errorMessage: "disabledAppStateBreadcrumbsBehaviour"
      }
    ))
  }

  disabledAllAppStateBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: Bugsnag.createClient({
          endpoints: endpoints,
          autoDetectErrors: false,
          autoTrackSessions: false,
          enabledBreadcrumbTypes: []
        }),
        errorMessage: "disabledAllAppStateBreadcrumbsBehaviour"
      }
    ))
  }

  overrideAppStateBreadcrumbsBehaviour = () => {
    this.setState(() => (
      {
        client: Bugsnag.createClient({
          endpoints: endpoints,
          autoDetectErrors: false,
          autoTrackSessions: false,
          enabledBreadcrumbTypes: ['state']
        }),
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
