import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useQuery, gql } from '@apollo/client';
import { TRANSLATE_SUTRA_QUERY } from '../graphql/queries/translateSutra';

export default function Translate() {
  const [inputText, setInputText] = useState('');
  const [sutraToTranslate, setSutraToTranslate] = useState<string | null>(null);

  const { data, loading, error } = useQuery(TRANSLATE_SUTRA_QUERY, {
    variables: { sutra: sutraToTranslate },
    skip: !sutraToTranslate,
  });

  const handleTranslate = () => {
    if (inputText.trim()) {
      setSutraToTranslate(inputText);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Sanskrit text"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <Pressable
          style={styles.button}
          onPress={handleTranslate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Translate</Text>
        </Pressable>
      </View>

      {loading && <Text style={styles.loading}>Loading...</Text>}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}

      {data?.translateSutra && (
        <View style={styles.resultsContainer}>
          {/* Original Text */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Original Text:</Text>
            {data.translateSutra.originalText.map((line: string, index: number) => (
              <Text key={`original-${index}`} style={styles.text}>
                {line}
              </Text>
            ))}
          </View>

          {/* IAST Text */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IAST:</Text>
            {data.translateSutra.iastText.map((line: string, index: number) => (
              <Text key={`iast-${index}`} style={styles.text}>
                {line}
              </Text>
            ))}
          </View>

          {/* Word Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Word Breakdown:</Text>
            {data.translateSutra.words.map((wordInfo: { word: string; meanings: string[] }, index: number) => (
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

          {/* Alternative Translations */}
          {data.translateSutra.alternativeTranslations &&
           data.translateSutra.alternativeTranslations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alternative Translations:</Text>
              {data.translateSutra.alternativeTranslations.map((alt: string, index: number) => (
                <Text key={`alt-${index}`} style={styles.text}>
                  {alt}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
  },
  error: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
    color: '#ff0000',
  },
  resultsContainer: {
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
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
