import * as React from 'react';
import {View, Text} from 'react-native';
import {Navigation} from 'react-native-navigation';
import styles from './styles';

// Settings screen declaration - this is the screen we'll be pushing into the stack
const SettingsScreen = () => {
  return (
    <View style={styles.root}>
      <Text>Settings Screen</Text>
    </View>
  );
};

export default SettingsScreen;
