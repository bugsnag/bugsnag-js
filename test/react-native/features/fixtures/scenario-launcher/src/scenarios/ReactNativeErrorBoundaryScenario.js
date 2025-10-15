import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { Text, View } from 'react-native'
import Scenario from './Scenario'

const onError = (event) => {
  // callback will only run for errors caught by boundary
}

export class ReactNativeErrorBoundaryScenario extends Scenario {
  view () {
    const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)
    return (
      <ErrorBoundary FallbackComponent={ErrorView} onError={onError}>
        <MainView />
      </ErrorBoundary>
    )
  }

  run () {
    // Error is thrown during render
  }
}

function ErrorView () {
  return (
    <View>
      <Text>There was an error</Text>
    </View>
  )
}

function MainView () {
  return (
    <View>
      <Text>Hello world {text()}</Text>
    </View>
  )
}

const text = function () {
  throw new Error('borked')
}
