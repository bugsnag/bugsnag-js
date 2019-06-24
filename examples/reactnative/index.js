/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { Client } from 'bugsnag-react-native';
const bugsnag = new Client('YOUR-API-KEY-HERE');

AppRegistry.registerComponent(appName, () => App);
