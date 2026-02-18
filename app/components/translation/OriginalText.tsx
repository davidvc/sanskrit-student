import { View, Text } from 'react-native';

interface OriginalTextProps {
  lines: string[];
}

export default function OriginalText({ lines }: OriginalTextProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold">Original Text:</Text>
      {lines.map((line: string, index: number) => (
        <Text key={`original-${index}`} className="text-base mb-1">
          {line}
        </Text>
      ))}
    </View>
  );
}
