import * as React from 'react'
import { View, Text, Button } from 'react-native'
import { Navigation } from 'react-native-navigation'
import Bugsnag from '@bugsnag/react-native'

const DetailsScreen = (props) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={() =>
          Navigation.pop(props.componentId)
        }/>
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={() => Bugsnag.notify(new Error('DetailsNavigationError'))}/>
      <Button title='Notify unhandled error'
        accessibilityLabel='sendUnhandled'
        onPress={() => {
          throw new Error('DetailsNavigationUnhandledError')
        }}/>
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={() => Bugsnag.setContext('detailsSetContext')}/>
    </View>
  )
}

export default DetailsScreen
