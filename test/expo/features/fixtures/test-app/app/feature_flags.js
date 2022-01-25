import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

const addFeatureFlagsOnError = function (event) {
  event.addFeatureFlag('from global on error 1', 'on error 1')

  event.addFeatureFlags([
    { name: 'from global on error 2' },
    { name: 'from global on error 3', variant: 111 }
  ])

  event.clearFeatureFlag('from config 3')
  event.clearFeatureFlag('added at runtime 3')
}

const clearFeatureFlagsOnError = function (event) {
  event.clearFeatureFlags()
}

export default class Unhandled extends Component {
  constructor (props) {
    super(props)
  }

  unhandledError = () => {
    this._setupFeatureFlags()

    throw new Error('bad things')
  }

  handledError = () => {
    this._setupFeatureFlags()

    bugsnagClient.notify(new Error('bad things'), function(event) {
      event.addFeatureFlag('from notify on error', 'notify 7636390')
      event.clearFeatureFlag('from global on error 2')
    })
  }

  unhandledErrorClearFeatureFlags = () => {
    this._setupFeatureFlags()

    bugsnagClient.addOnError(clearFeatureFlagsOnError)

    throw new Error('bad things')
  }

  handledErrorClearFeatureFlags = () => {
    this._setupFeatureFlags()

    bugsnagClient.notify(new Error('bad things'), clearFeatureFlagsOnError)
  }

  _setupFeatureFlags () {
    bugsnagClient.addFeatureFlag('added at runtime 1')
    bugsnagClient.addFeatureFlags([
      { name: 'added at runtime 2', variant: 'runtime_2' },
      { name: 'added at runtime 3', variant: 'SHOULD BE REMOVED' },
      { name: 'added at runtime 4' }
    ])

    bugsnagClient.addOnError(addFeatureFlagsOnError)
  }

  render() {
    // reset the bugsnag client so tests don't interfere wtih eachother
    bugsnagClient.clearFeatureFlags()
    bugsnagClient.removeOnError(addFeatureFlagsOnError)
    bugsnagClient.removeOnError(clearFeatureFlagsOnError)

    return (
      <View>
        <Button accessibilityLabel="unhandledErrorWithFeatureFlagsButton"
          title="unhandledErrorWithFeatureFlags"
          onPress={this.unhandledError}
        />

        <Button accessibilityLabel="unhandledErrorClearFeatureFlagsButton"
          title="unhandledErrorClearFeatureFlags"
          onPress={this.unhandledErrorClearFeatureFlags}
        />

        <Button accessibilityLabel="handledErrorWithFeatureFlagsButton"
          title="handledErrorWithFeatureFlags"
          onPress={this.handledError}
        />

        <Button accessibilityLabel="handledErrorClearFeatureFlagsButton"
          title="handledErrorClearFeatureFlags"
          onPress={this.handledErrorClearFeatureFlags}
        />
      </View>
    )
  }
}
