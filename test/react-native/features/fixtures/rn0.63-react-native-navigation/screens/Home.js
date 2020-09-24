import * as React from 'react';
import {View, Button, Text} from 'react-native';
import {Navigation} from 'react-native-navigation';
import styles from './styles';
import Bugsnag from '@bugsnag/react-native'

const HomeScreen = (props) => {
  return (
    <View style={styles.root}>
      <Text>Hello React Native Navigation 👋</Text>
      <Button
        title="Push Settings Screen"
        color="#710ce3"
        onPress={() =>
          Navigation.push(props.componentId, {
            component: {
              name: 'Settings',
              options: {
                topBar: {
                  title: {
                    text: 'Settings',
                  },
                },
              },
            },
          })
        }
      />
      <Button onPress={() => Bugsnag.notify(new Error('hi'))} title="Error" />
    </View>
  );
};

HomeScreen.options = {
  topBar: {
    title: {
      text: 'Home',
      color: 'white',
    },
    background: {
      color: '#4d089a',
    },
  },
};

export default HomeScreen;
