import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { Text, View } from 'react-native'

export class ReactErrorBoundaryScenario extends Scenario {
  constructor (_configuration, jsConfig) {
    super()
  }

  view () {
    const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary()

    return (
      <ErrorBoundary FallbackComponent={ErrorView}>
        <MainView />
      </ErrorBoundary>
    )
  }

  run () {
    // The error is thrown during render
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
