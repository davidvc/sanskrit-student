import { View, Text, StyleSheet } from 'react-native';

interface WordInfo {
  word: string;
  meanings: string[];
}

interface WordBreakdownProps {
  words: WordInfo[];
}

export default function WordBreakdown({ words }: WordBreakdownProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Word Breakdown:</Text>
      {words.map((wordInfo: WordInfo, index: number) => (
        <View key={`word-${index}`} style={styles.wordContainer}>
          <Text style={styles.word}>{wordInfo.word}</Text>
          {wordInfo.meanings.map((meaning: string, mIndex: number) => (
            <Text key={`meaning-${mIndex}`} style={styles.meaning}>
              {meaning}
            </Text>
          ))}
        </View>
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
  wordContainer: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  word: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meaning: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
});
