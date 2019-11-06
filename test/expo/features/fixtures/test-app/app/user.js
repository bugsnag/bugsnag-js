import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class User extends Component {
  userClient = () => {
    bugsnagClient.setUser("123", "bug@sn.ag", "userClientName")
    bugsnagClient.notify(new Error('UserClientError'))
  }

  userCallback = () => {
    bugsnagClient.notify(new Error('UserCallbackError'), event => {
      event.setUser("123", "bug@sn.ag", "userCallbackName")
    })
  }

  render() {
    return (
      <View>
        <Button accessibilityLabel="userClientButton"
          title="userClient"
          onPress={this.userClient}
        />
        <Button accessibilityLabel="userCallbackButton"
          title="userCallback"
          onPress={this.userCallback}
        />
      </View>
    )
  }
}
