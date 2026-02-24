import { View, Text } from 'react-native';

interface AlternativeTranslationsProps {
  translations: string[];
}

export default function AlternativeTranslations({ translations }: AlternativeTranslationsProps) {
  if (!translations || translations.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold">Alternative Translations:</Text>
      {translations.slice(0, 3).map((alt: string, index: number) => (
        <Text key={`alt-${index}`} className="text-base mb-1">
          {alt}
        </Text>
      ))}
    </View>
  );
}
