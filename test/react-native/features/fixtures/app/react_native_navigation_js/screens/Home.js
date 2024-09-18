import * as React from 'react'
import { View, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'
import Bugsnag from '@bugsnag/react-native'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const HomeScreen = (props) => {
  React.useEffect(() => {
    (async () => {
      await delay(100)
      Bugsnag.notify(new Error('HomeNavigationError'))
      await delay(250)
      Navigation.push(props.componentId, {
        component: {
          name: 'Details'
        }
      })
    })()
  }, [])

  return (
    <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
      <Text>Home Screen</Text>
    </View>
  )
}

export default HomeScreen
