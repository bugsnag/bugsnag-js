import * as React from 'react';
import {View, Button, Text, NativeModules} from 'react-native';
import {Navigation} from 'react-native-navigation';
import Bugsnag from '@bugsnag/react-native';
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation';

const HomeScreen = (props) => {
  NativeModules.BugsnagTestInterface.startBugsnag({
    apiKey: '12312312312312312312312312312312',
    endpoint: 'http://bs-local.com:9339',
    autoTrackSessions: false
  }, () => {
    Bugsnag.start({
      plugins: [new BugsnagReactNativeNavigation()],
    })
    console.log("Started")
  })
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Home Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={() =>
          Navigation.push(props.componentId, {
            component: {
              name: 'Details',
              options: {
                topBar: {
                  title: {
                    text: 'Details',
                  },
                },
              },
            },
          })
        } />
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={() => Bugsnag.notify(new Error('HomeNavigationError'))} />
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={() => Bugsnag.setContext('homeSetContext')} />
    </View>
  );
};

export default HomeScreen;
