import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface LightingTipProps {
  visible: boolean;
  onDismiss: () => void;
}

export function LightingTip({ visible, onDismiss }: LightingTipProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} testID="lighting-tip-container">
      <Text style={styles.text}>
        💡 Tip: Use bright, even lighting for best results
      </Text>
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={onDismiss}
        testID="dismiss-tip-button"
      >
        <Text style={styles.dismissButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    paddingRight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
});
