import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { Text, View } from 'react-native'
import Scenario from './Scenario'

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
