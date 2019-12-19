import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class ManualBreadcrumbs extends Component {
  manualBreadcrumb = () => {
    while (bugsnagClient._breadcrumbs.length > 0) {
      bugsnagClient._breadcrumbs.pop()
    }
    bugsnagClient.leaveBreadcrumb("manualBreadcrumb", {
      reason: "testing"
    })
    bugsnagClient.notify(new Error("ManualBreadcrumbError"))
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="manualBreadcrumbButton"
          title="manualBreadcrumb"
          onPress={this.manualBreadcrumb}
        />
      </View>
    )
  }
}
