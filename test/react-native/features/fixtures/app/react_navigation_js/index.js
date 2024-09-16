/**
 * @format
 */

import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import App from './app/App'
import { name as appName } from './app.json'

console.reportErrorsAsExceptions = false

AppRegistry.registerComponent(appName, () => App)
