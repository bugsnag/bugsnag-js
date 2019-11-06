import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class IgnoreReport extends Component {
  ignoreReportFalse = () => {
    bugsnagClient.notify(new Error('IgnoredError'), report => {
      return false
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="ignoreReportFalseButton"
          title="ignoreReportFalse"
          onPress={this.ignoreReportFalse}
        />
      </View>
    )
  }
}
