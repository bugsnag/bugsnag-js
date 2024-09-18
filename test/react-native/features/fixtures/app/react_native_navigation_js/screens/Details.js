import * as React from 'react'
import { View, Text } from 'react-native'
import Bugsnag from '@bugsnag/react-native'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const DetailsScreen = (props) => {
  React.useEffect(() => {
    (async () => {
      await delay(100)
      Bugsnag.notify(new Error('DetailsNavigationError'))
      await delay(250)
      throw new Error('DetailsNavigationUnhandledError')
    })()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
    </View>
  )
}

export default DetailsScreen
