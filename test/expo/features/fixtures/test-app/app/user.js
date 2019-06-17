import React, { Component } from 'react'
import { View, Button } from 'react-native'
import { bugsnagClient } from './bugsnag'

export default class User extends Component {
  userClient = () => {
    bugsnagClient.user = {
      name: "userClientName"
    }
    bugsnagClient.notify(new Error('UserClientError'))
  }

  userCallback = () => {
    bugsnagClient.notify(new Error('UserCallbackError'),
    {
      beforeSend: report => {
        report.user = {
          name: "userCallbackName"
        }
      }
    })
  }

  userOpts = () => {
    bugsnagClient.notify(new Error('UserOptsError'),
    {
      user: {
        name: "userOptsName"
      }
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
        <Button accessibilityLabel="userOptsButton"
          title="userOpts"
          onPress={this.userOpts}
        />
      </View>
    )
  }
}