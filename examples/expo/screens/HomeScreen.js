import Bugsnag from '@bugsnag/expo';
import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
} from 'react-native';

export default class HomeScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  state = {
    shouldError: false,
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.welcomeContainer}>
            <Image
              source={require('../assets/images/bugsnag.png')}
              style={styles.welcomeImage}
            />
          </View>

          <Text style={styles.welcomeText}>Welcome to the Bugsnag / Expo example app. Press the buttons below send errors.</Text>
          <Text style={styles.welcomeText}>Add your API key to <Text style={styles.codeText}>app.json</Text> if you want to see the errors in your dashboard.</Text>

          <View style={styles.getStartedContainer}>

            <View style={styles.errorButtonView}>
              <Button title="Send a handled error" onPress={() => Bugsnag.notify(new Error('till roll out of paper'))} />
            </View>
            <View style={styles.errorButtonView}>
              <Button title="Send an unhandled error" onPress={() => { throw new Error('unexpected item in bagging area')}} />
            </View>
            <View style={styles.errorButtonView}>
              <Button title="Add user information" onPress={() => { Bugsnag.setUser('123', 'bugs.nag@bugsnag.com', 'Bug McSnag') }} />
            </View>
            <View style={styles.errorButtonView}>
              <Button title="Send a render error" onPress={() => { this.setState({ shouldError: true })}} />
            </View>

            {this.state.shouldError ? <Text>{this.state.message.toLowerCase()}</Text> : undefined}

          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  welcomeText: {
    marginBottom: 20,
    marginLeft: 50,
    marginRight: 50,
    marginTop: 0,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 50,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  errorButtonView: {
    marginBottom: 10,
  },
  codeText: {
    fontFamily: 'space-mono',
  }
});
