import { View, Text, StyleSheet } from 'react-native';

interface AlternativeTranslationsProps {
  translations: string[];
}

export default function AlternativeTranslations({ translations }: AlternativeTranslationsProps) {
  if (!translations || translations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Alternative Translations:</Text>
      {translations.slice(0, 3).map((alt: string, index: number) => (
        <Text key={`alt-${index}`} style={styles.text}>
          {alt}
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
