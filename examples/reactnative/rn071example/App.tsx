/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react'
import type {PropsWithChildren} from 'react'
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  Platform,
  View,
} from 'react-native'

// Setup Bugsnag client to capture errors automatically
import Bugsnag from '@bugsnag/react-native'
Bugsnag.start()

const bogusObject = {} as any

function triggerException() {
  bogusObject.bogusFunction()
}

function triggerHandledException() {
  bogusObject.bogusHandledFunction()
}

async function triggerPromiseRejection() {
  // try {
  //   await NativeModules.CrashyCrashy.generatePromiseRejection()
  // } catch (e: any) {
  //   Bugsnag.notify(e)
  // }
}

function triggerNativeException() {
  // NativeModules.CrashyCrashy.generateCrash()
}

function triggerNativeHandledError() {
  // NativeModules.CrashyCrashy.handledError()
}

type SectionProps = PropsWithChildren<{
  title: string
}>

function App(): JSX.Element {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes ({global.__turboModuleProxy != null ? 'Turbo' : 'Native'} Modules)</Text>
            </View>
          )}
          <View style={styles.container}>
            <Text style= {{
              paddingTop: 40,
              margin: 20,
            }}>Press the buttons below to test examples of Bugsnag functionality. Make sure you have changed the API key in Info.plist or AndroidManifest.xml.</Text>
            <ScrollView>
              <View style={styles.buttonContainer}>

                <Button
                  title="Trigger JS Exception"
                  onPress={triggerException} />
                <Text style={styles.info}>
                  Tap this button to send a JS crash to Bugsnag
                </Text>

                <Button
                  title="Trigger Native Exception"
                  onPress={triggerNativeException} />
                <Text style={styles.info}>
                  Tap this button to send a native {Platform.OS} crash to Bugsnag
                </Text>

                <Button
                  title="Send Handled JS Exception"
                  onPress={() => {
                    try { // execute crashy code
                      triggerHandledException()
                    } catch (error: any) {
                      Bugsnag.notify(error)
                    }
                  }} />
                <Text style={styles.info}>
                  Tap this button to send a handled error to Bugsnag
                </Text>

                <Button
                  title="Trigger Promise Rejection"
                  onPress={() => {
                    try { // execute crashy code
                      triggerPromiseRejection()
                    } catch (error: any) {
                      Bugsnag.notify(error)
                    }
                  }} />
                <Text style={styles.info}>
                  Tap this button to send a native promise rejection to Bugsnag
                </Text>

                <Button
                  title="Send Handled Native Exception"
                  onPress={() => {
                    triggerNativeHandledError()
                  }} />
                <Text style={styles.info}>
                  Tap this button to send a native handled error to Bugsnag
                </Text>

                <Button
                  title="Set user"
                  onPress={() => {
                    try { // execute crashy code
                      throw new Error("Error with user")
                    } catch (error) {
                      Bugsnag.setUser("user-5fab67", "john@example.com", "John Smith")
                      Bugsnag.notify(error)
                    }
                  }} />
                <Text style={styles.info}>
                  Tap this button to send a handled error with user information to Bugsnag
                </Text>

                <Button
                  title="Leave breadcrumbs"
                  onPress={() => {
                    // log a breadcrumb, which will be attached to the error report
                    Bugsnag.leaveBreadcrumb('About to execute crashy code', {
                      type: 'user'
                    })

                    try { // execute crashy code
                      throw new Error("Error with breadcrumbs")
                    } catch (error) {
                      Bugsnag.notify(error)
                    }
                  }} />
                <Text style={styles.info}>
                  Tap this button to send a handled error with manual breadcrumbs
                </Text>

              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eeeeee',
  },
  buttonContainer: {
    margin: 20
  },
  info: {
    textAlign: 'center',
    color: '#666',
    fontSize: 11,
    marginBottom: 20
  }
})

export default App
