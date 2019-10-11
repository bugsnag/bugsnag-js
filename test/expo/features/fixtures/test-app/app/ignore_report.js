import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class IgnoreReport extends Component {
  ignoreReportIgnore = () => {
    bugsnagClient.notify(new Error('IgnoredError'), {
      beforeSend: report => {
        report.ignore()
      }
    })
  }

  ignoreReportFalse = () => {
    bugsnagClient.notify(new Error('IgnoredError'), {
      beforeSend: report => {
        return false
      }
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="ignoreReportIgnoreButton"
          title="ignoreReportIgnore"
          onPress={this.ignoreReportIgnore}
        />
        <Button accessibilityLabel="ignoreReportFalseButton"
          title="ignoreReportFalse"
          onPress={this.ignoreReportFalse}
        />
      </View>
    )
  }
}