/**
 * @format
 */

import {Navigation} from 'react-native-navigation';
import HomeScreen from './screens/Home';
import DetailsScreen from './screens/Details';

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
