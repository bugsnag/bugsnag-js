import React, {Component} from 'react';
import {View, Text, Button, NativeModules} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Bugsnag from '@bugsnag/react-native';
import BugsnagReactNavigation from '@bugsnag/plugin-react-navigation';

function HomeScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Home Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={() => navigation.navigate('Details')} />
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={() => Bugsnag.notify(new Error('HomeNavigationError'))} />
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={() => Bugsnag.setContext('homeSetContext')} />
    </View>
  );
}

function DetailsScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Details Screen</Text>
      <Button title='Navigate'
        accessibilityLabel='navigate'
        onPress={() => navigation.navigate('Home')} />
      <Button title='Notify handled error'
        accessibilityLabel='sendHandled'
        onPress={() => Bugsnag.notify(new Error('DetailsNavigationError'))} />
      <Button title='Set context'
        accessibilityLabel='setContext'
        onPress={() => Bugsnag.setContext('detailsSetContext')} />
    </View>
  );
}



export default class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      showNav: false
    }
    NativeModules.BugsnagTestInterface.startBugsnag({
      apiKey: '12312312312312312312312312312312',
      endpoint: 'http://bs-local.com:9339',
      autoTrackSessions: false
    }, () => {
      Bugsnag.start({
        plugins: [new BugsnagReactNavigation()],
      })
      console.log("Started")
      this.setState(() => ({showNav: true}))
    })
  }

  render () {
    if (this.state.showNav) {
      const Stack = createStackNavigator();
      const BugsnagNavigationContainer = Bugsnag.getPlugin('reactNavigation').createNavigationContainer(NavigationContainer);
      return (
        <BugsnagNavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'HomeScreen'}}
            />
            <Stack.Screen
              name="Details"
              component={DetailsScreen}
              options={{title: 'DetailsScreen'}}
            />
          </Stack.Navigator>
        </BugsnagNavigationContainer>
      );
    } else {
      return (
        <Text>Waiting</Text>
      )
    }
  }
}

