import { View } from 'react-native';
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
  alternativeTranslations?: string[] | null;
}

interface TranslationResultProps {
  data: TranslationData;
  onCopyIast: () => void;
}

export default function TranslationResult({ data, onCopyIast }: TranslationResultProps) {
  return (
    <View className="mt-4">
      <OriginalText lines={data.originalText} />
      <IastText lines={data.iastText} onCopy={onCopyIast} />
      <WordBreakdown words={data.words} />
      <AlternativeTranslations translations={data.alternativeTranslations || []} />
    </View>
  );
}
