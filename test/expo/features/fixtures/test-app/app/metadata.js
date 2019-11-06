import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class Metadata extends Component {
  metadataClient = () => {
    bugsnagClient.addMetadata("extra", "reason", "metadataClientName")
    bugsnagClient.notify(new Error('MetadataClientError'))
  }

  metadataCallback = () => {
    bugsnagClient.notify(new Error('MetadataCallbackError'),
      event => event.addMetadata('extra', 'reason', "metadataCallbackName")
    )
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="metadataClientButton"
          title="metadataClient"
          onPress={this.metadataClient}
        />
        <Button accessibilityLabel="metadataCallbackButton"
          title="metadataCallback"
          onPress={this.metadataCallback}
        />
      </View>
    )
  }
}
