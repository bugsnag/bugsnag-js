import React from 'react';
import Bugsnag from "@bugsnag/react-native";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button, NativeModules
} from 'react-native';

import {
  Colors
} from 'react-native/Libraries/NewAppScreen';

function jsNotify() {
  try { // execute crashy code
    iMadeThisUp();
  } catch (error) {
    console.log('Bugsnag.notify JS error')
    Bugsnag.notify(error);
  }
}

function nativeNotify() {
  console.log('Bugsnag.notify native error')
  NativeModules.CrashyCrashy.handledError()
}

const App: () => React$Node = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}
          <View style={styles.body}>
            <Text>React Native CLI end-to-end test app</Text>
            <Button style={styles.clickyButton}
                    accessibilityLabel='js_notify'
                    title='JS Notify'
                    onPress={jsNotify}/>
            <Button style={styles.clickyButton}
                    accessibilityLabel='native_notify'
                    title='Native Notify'
                    onPress={nativeNotify}/>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  clickyButton: {
    backgroundColor: '#acbcef',
    borderWidth: 0.5,
    borderColor: '#000',
    borderRadius: 4,
    margin: 5,
    padding: 5
  }
});

export default App;
