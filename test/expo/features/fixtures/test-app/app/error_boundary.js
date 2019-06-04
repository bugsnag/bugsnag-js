import React, { Component } from 'react'
import { View, Button, Text } from 'react-native'
import { bugsnagClient } from './bugsnag'

const ErrorBound = bugsnagClient.getPlugin('react')

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ebTrigger: false,
      fallbackTrigger: false
    }
  }

  triggerErrorBoundary = () => {
    this.setState(previous => (
      {
        ebTrigger: true,
        fallbackTrigger: false
      }
    ))
  }

  renderErrorBoundary = () => {
    if (this.state.ebTrigger) {
      return (
        <Buggy />
      )
    } else {
      return null;
    }
  }

  triggerFallback = () => {
    this.setState(previous => (
      {
        ebTrigger: false,
        fallbackTrigger: true
      }
    ))
  }

  renderFallback = () => {
    if (this.state.fallbackTrigger) {
      return (
        <Buggy />
      )
    } else {
      return null;
    }
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="errorBoundaryButton"
          title="errorBoundary"
          onPress={this.triggerErrorBoundary}/>
        <Button accessibilityLabel="errorBoundaryFallbackButton"
          title="errorBoundaryFallback"
          onPress={this.triggerFallback}/>
        <ErrorBound>
          { this.renderErrorBoundary() }
        </ErrorBound>
        <ErrorBound FallbackComponent={Fallback}>
          { this.renderFallback() }
        </ErrorBound>
      </View>
    )
  }
}

class Fallback extends Component {
  render() {
    return (
      <View accessibilityLabel="errorBoundaryFallback">
        <Text>Buggy!</Text>
      </View>
    )
  }
}

class Buggy extends Component {
  componentDidMount() {
    throw new Error("An error has occurred in Buggy component!");
  }

  render() {
    return (
      <View></View>
    )
  }
}

