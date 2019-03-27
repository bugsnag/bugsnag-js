import bugsnag from '@bugsnag/expo'
const bugsnagClient = bugsnag({
  apiKey: 'MyApiKey',
  endpoints: {
    notify: 'http://localhost:9339',
    sessions: 'http://localhost:9339'
  },
  autoCaptureSessions: false
})

import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'

function handledError() {
  console.log("handledError");
  bugsnagClient.notify(new Error('HandledError'));
}

function handledCaughtError() {
  console.log("handledCaughtError");
  try {
    throw new Error('HandledCaughtError');
  } catch (error) {
    bugsnagClient.notify(error);
  }
}

function unhandledError() {
  console.log("unhandledError");
  throw new Error('UnhandledError');
}

function manualSession() {
  console.log("manualSession");
  bugsnagClient.startSession();
}

export default class App extends React.Component {
  render () {
    return (
      <View style={styles.container}>
        <Text>Test App</Text>
        <Button accessibilityLabel="unhandledErrorButton"
          title="unhandledError"
          onPress={unhandledError}
        />
        <Button accessibilityLabel="manualSessionButton"
          title="manualSession"
          onPress={manualSession}
        />
        <Button accessibilityLabel="handledErrorButton"
          title="handledError"
          onPress={handledError}
        />
        <Button accessibilityLabel="handledCaughtErrorButton"
          title="handledCaughtError"
          onPress={handledCaughtError}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
