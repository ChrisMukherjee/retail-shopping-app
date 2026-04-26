import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingSpinner() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
