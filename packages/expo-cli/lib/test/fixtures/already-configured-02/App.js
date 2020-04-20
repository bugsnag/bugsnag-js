const Bugsnag = require('@bugsnag/expo')
const React = require('react')
const { StyleSheet, Text, View } = require('react-native')

Bugsnag.start()

export default class App extends React.Component {
  render () {
    return (
      <View style={styles.container}>
        <Text>Hello Expo!</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
