/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import Bugsnag from "@bugsnag/react-native";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar, Button, NativeModules
} from 'react-native'

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
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

const Section = ({children, title}): Node => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  return (
    <SafeAreaView style={backgroundStyle}>
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
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
