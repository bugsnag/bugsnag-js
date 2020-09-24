import * as React from 'react';
import {View, Text, Button} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Bugsnag from '@bugsnag/react-native';
import BugsnagReactNavigation from '@bugsnag/plugin-react-navigation';

Bugsnag.start({
  plugins: [new BugsnagReactNavigation()],
});

function HomeScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Home Screen</Text>
      <Button title="Details" onPress={() => navigation.navigate('Details')} />
      <Button title="Bugsnag" onPress={() => Bugsnag.notify(new Error('hi'))} />
    </View>
  );
}

function DetailsScreen({navigation}) {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Details Screen</Text>
      <Button title="Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
}

const Stack = createStackNavigator();

const BugsnagNavigationContainer = Bugsnag.getPlugin('reactNavigation').createNavigationContainer(NavigationContainer);

function App() {
  return (
    <BugsnagNavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Awesome app home'}}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{title: 'Awesome app details'}}
        />
      </Stack.Navigator>
    </BugsnagNavigationContainer>
  );
}

export default App;
