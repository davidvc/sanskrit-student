import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ProgressState } from '../../types/camera.types';
import { getProgressMessage } from '../../config/progressMessages';

interface ProgressViewProps {
  progressState: ProgressState;
}

export function ProgressView({ progressState }: ProgressViewProps) {
  return (
    <View style={styles.container} testID="progress-view">
      <ActivityIndicator size="large" color="#007AFF" testID="upload-progress-indicator" />
      <Text style={styles.progressText}>{getProgressMessage(progressState)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  progressText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});
