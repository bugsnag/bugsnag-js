import * as React from 'react'
import { View, Button, Text } from 'react-native'
import { Navigation } from 'react-native-navigation'
import Bugsnag from '@bugsnag/react-native'

const HomeScreen = (props) => {
  return (
    <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
      <Text>Home Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={ () =>
          Navigation.push(props.componentId, {
            component: {
              name: 'Details'
            }
          })
        }/>
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={ () => Bugsnag.notify(new Error('HomeNavigationError')) }/>
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={ () => Bugsnag.setContext('homeSetContext') }/>
    </View>
  )
}

export default HomeScreen
