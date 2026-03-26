import { View, Text, StyleSheet } from 'react-native';
import CopyButton from '../ui/CopyButton';

interface IastTextProps {
  lines: string[];
  onCopy: () => void;
}

export default function IastText({ lines, onCopy }: IastTextProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>IAST:</Text>
        <CopyButton
          onPress={onCopy}
          testID="copy-iast-button"
          accessibilityLabel="Copy IAST text to clipboard"
        />
      </View>
      {lines.map((line: string, index: number) => (
        <Text key={`iast-${index}`} style={styles.text}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
});
