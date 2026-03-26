import { Pressable, Text, StyleSheet } from 'react-native';

interface CopyButtonProps {
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

export default function CopyButton({ onPress, testID, accessibilityLabel }: CopyButtonProps) {
  return (
    <Pressable
      style={styles.copyButton}
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Text style={styles.copyButtonText}>Copy</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
