import React from 'react';
import { StyleSheet, View } from 'react-native';
import LoginForm from '../../src/modules/auth/components/LoginForm';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <LoginForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 