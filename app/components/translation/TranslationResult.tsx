import { View, StyleSheet } from 'react-native';
import OriginalText from './OriginalText';
import IastText from './IastText';
import WordBreakdown from './WordBreakdown';
import AlternativeTranslations from './AlternativeTranslations';

interface TranslationData {
  originalText: string[];
  iastText: string[];
  words: Array<{
    word: string;
    meanings: string[];
  }>;
  alternativeTranslations?: string[];
}

interface TranslationResultProps {
  data: TranslationData;
  onCopyIast: () => void;
}

export default function TranslationResult({ data, onCopyIast }: TranslationResultProps) {
  return (
    <View style={styles.resultsContainer}>
      <OriginalText lines={data.originalText} />
      <IastText lines={data.iastText} onCopy={onCopyIast} />
      <WordBreakdown words={data.words} />
      <AlternativeTranslations translations={data.alternativeTranslations || []} />
    </View>
  );
}

const styles = StyleSheet.create({
  resultsContainer: {
    marginTop: 16,
  },
});
