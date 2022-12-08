import { AppRegistry } from 'react-native'
import App from './app/App'
import { name as appName } from './app.json'
import MazeRunnerNative from './NativeMazeRunnerModule'

global.MazeRunnerNative = MazeRunnerNative

AppRegistry.registerComponent(appName, () => App)
