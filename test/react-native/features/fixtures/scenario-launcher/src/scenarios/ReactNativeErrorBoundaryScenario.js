import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { Text, View } from 'react-native'
import Scenario from './Scenario'

export class ReactNativeErrorBoundaryScenario extends Scenario {
  constructor (_configuration, jsConfig) {
    super()
    jsConfig.autoTrackSessions = false
    jsConfig.autoDetectErrors = true
    jsConfig.enabledErrorTypes = {
      unhandledExceptions: true,
      unhandledRejections: true
    }
  }

  view () {
    const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)

    return (
      <ErrorBoundary FallbackComponent={ErrorView}>
        <MainView />
      </ErrorBoundary>
    )
  }

  run () {
    setTimeout(() => {}, 2000)
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
  const [shouldThrow, setShouldThrow] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldThrow(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (shouldThrow) {
    throw new Error('borked')
  }

  return (
    <View>
      <Text>Hello world</Text>
    </View>
  )
}
