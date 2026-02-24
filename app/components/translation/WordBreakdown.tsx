import { View, Text } from 'react-native';

interface WordInfo {
  word: string;
  meanings: string[];
}

interface WordBreakdownProps {
  words: WordInfo[];
}

export default function WordBreakdown({ words }: WordBreakdownProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold">Word Breakdown:</Text>
      {words.map((wordInfo: WordInfo, index: number) => (
        <View key={`word-${index}`} className="mb-3 pb-2 border-b border-gray-200">
          <Text className="text-base font-semibold mb-1">{wordInfo.word}</Text>
          {wordInfo.meanings.map((meaning: string, mIndex: number) => (
            <Text key={`meaning-${mIndex}`} className="text-sm text-gray-600 ml-3">
              {meaning}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
