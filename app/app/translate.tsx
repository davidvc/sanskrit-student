import { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@apollo/client';
import * as Clipboard from 'expo-clipboard';
import { TRANSLATE_SUTRA_QUERY } from '../graphql/queries/translateSutra';
import SutraInput from '../components/translation/SutraInput';
import TranslationResult from '../components/translation/TranslationResult';

export default function Translate() {
  const [inputText, setInputText] = useState('');
  const [sutraToTranslate, setSutraToTranslate] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shouldShowResults, setShouldShowResults] = useState(false);
  const [copyConfirmation, setCopyConfirmation] = useState(false);

  const { data, loading, error } = useQuery(TRANSLATE_SUTRA_QUERY, {
    variables: { sutra: sutraToTranslate },
    skip: !sutraToTranslate,
    onCompleted: () => {
      setShouldShowResults(true);
    },
  });

  const handleTranslate = () => {
    setValidationError(null);
    setShouldShowResults(false);
    setCopyConfirmation(false);
    if (inputText.trim()) {
      setSutraToTranslate(inputText);
    } else {
      setValidationError('Please enter Sanskrit text to translate');
    }
  };

  const handleCopyIast = async () => {
    if (data?.translateSutra?.iastText) {
      try {
        const iastText = data.translateSutra.iastText.join('\n');
        await Clipboard.setStringAsync(iastText);
        setCopyConfirmation(true);
        setTimeout(() => setCopyConfirmation(false), 3000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <SutraInput
        value={inputText}
        onChangeText={setInputText}
        onTranslate={handleTranslate}
        disabled={loading}
      />

      {loading && <Text style={styles.loading}>Loading...</Text>}
      {validationError && <Text style={styles.error}>{validationError}</Text>}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}
      {copyConfirmation && <Text style={styles.success}>Copied to clipboard</Text>}

      {shouldShowResults && data?.translateSutra && (
        <TranslationResult
          data={data.translateSutra}
          onCopyIast={handleCopyIast}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  success: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
    color: '#00aa00',
  },
});
