/**
 * @format
 */

import {Navigation} from 'react-native-navigation';
import HomeScreen from './screens/Home';
import DetailsScreen from './screens/Details';
import {NativeModules} from 'react-native';
import Bugsnag from '@bugsnag/react-native';
import BugsnagReactNativeNavigation from '@bugsnag/plugin-react-native-navigation';

NativeModules.BugsnagTestInterface.startBugsnag({
  apiKey: '12312312312312312312312312312312',
  endpoint: 'http://bs-local.com:9339',
  autoTrackSessions: false
}).then(() => {
  Bugsnag.start({
    plugins: [new BugsnagReactNativeNavigation(Navigation)],
  })
})

Navigation.registerComponent('Home', () => HomeScreen);
Navigation.registerComponent('Details', () => DetailsScreen);
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
  })
})
