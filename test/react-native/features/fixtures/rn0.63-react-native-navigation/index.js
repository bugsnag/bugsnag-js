/**
 * @format
 */

import {Navigation} from 'react-native-navigation';
import HomeScreen from './screens/Home';
import SettingsScreen from './screens/Settings';

import Bugsnag from '@bugsnag/react-native';
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation';

Bugsnag.start({
  plugins: [new BugsnagReactNativeNavigation(Navigation)],
});

Navigation.registerComponent('Home', () => HomeScreen);
Navigation.registerComponent('Settings', () => SettingsScreen);

Navigation.events().registerAppLaunchedListener(async () => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'Home',
            },
          },
        ],
      },
    },
  });
});
