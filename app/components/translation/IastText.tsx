import { View, Text } from 'react-native';
import CopyButton from '../ui/CopyButton';

interface IastTextProps {
  lines: string[];
  onCopy: () => void;
}

export default function IastText({ lines, onCopy }: IastTextProps) {
  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold">IAST:</Text>
        <CopyButton
          onPress={onCopy}
          testID="copy-iast-button"
          accessibilityLabel="Copy IAST text to clipboard"
        />
      </View>
      {lines.map((line: string, index: number) => (
        <Text key={`iast-${index}`} className="text-base mb-1">
          {line}
        </Text>
      ))}
    </View>
  );
}
