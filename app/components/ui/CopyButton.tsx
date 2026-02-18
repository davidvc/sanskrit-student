import { Pressable, Text } from 'react-native';

interface CopyButtonProps {
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

export default function CopyButton({ onPress, testID, accessibilityLabel }: CopyButtonProps) {
  return (
    <Pressable
      className="bg-primary-500 py-1.5 px-3 rounded-md"
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Text className="text-white text-sm font-semibold">Copy</Text>
    </Pressable>
  );
}
