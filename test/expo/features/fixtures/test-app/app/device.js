import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class AppFeature extends Component {
  defaultDevice = () => {
    bugsnagClient.notify(new Error('DeviceDefaultError'))
  }

  clientDevice = () => {
    bugsnagClient.device.osVersion = 'testOSVersion'
    bugsnagClient.device.newThing = 'this is new'
    bugsnagClient.notify(new Error('DeviceClientError'))
  }

  callbackDevice = () => {
    bugsnagClient.notify(new Error('DeviceCallbackError'), {
      beforeSend: report => {
        report.device.model = 'brandNewPhone',
        report.device.newThing = 'another new thing'
      }
    })
  }

  optsDevice = () => {
    bugsnagClient.notify(new Error('DeviceOptsError'), {
      device: {
        id: "assuming direct control",
        newThing: "not original"
      }
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="deviceDefaultButton"
          title="defaultDevice"
          onPress={this.defaultDevice}
        />
        <Button accessibilityLabel="deviceClientButton"
          title="clientDevice"
          onPress={this.clientDevice}
        />
        <Button accessibilityLabel="deviceCallbackButton"
          title="callbackDevice"
          onPress={this.callbackDevice}
        />
        <Button accessibilityLabel="deviceOptsButton"
          title="optsDevice"
          onPress={this.optsDevice}
        />
      </View>
    )
  }
}