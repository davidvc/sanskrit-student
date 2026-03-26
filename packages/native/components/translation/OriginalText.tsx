import { View, Text, StyleSheet } from 'react-native';

interface OriginalTextProps {
  lines: string[];
}

export default function OriginalText({ lines }: OriginalTextProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Original Text:</Text>
      {lines.map((line: string, index: number) => (
        <Text key={`original-${index}`} style={styles.text}>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
});
