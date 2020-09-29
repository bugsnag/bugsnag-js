import * as React from 'react';
import {View, Text} from 'react-native';
import {Navigation} from 'react-native-navigation';
import Bugsnag from '@bugsnag/react-native'

const DetailsScreen = () => {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Details Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={() =>
          Navigation.push(props.componentId, {
            component: {
              name: 'Home',
              options: {
                topBar: {
                  title: {
                    text: 'Home',
                  },
                },
              },
            },
          })
        } />
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={() => Bugsnag.notify(new Error('DetailsNavigationError'))} />
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={() => Bugsnag.setContext('detailsSetContext')} />
    </View>
  );
};

export default DetailsScreen;
