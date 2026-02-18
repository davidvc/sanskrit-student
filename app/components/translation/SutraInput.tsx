import { View, TextInput, Pressable, Text } from 'react-native';

interface SutraInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onTranslate: () => void;
  disabled?: boolean;
}

export default function SutraInput({ value, onChangeText, onTranslate, disabled }: SutraInputProps) {
  return (
    <View className="mb-4">
      <TextInput
        className="border border-gray-300 rounded-lg p-3 text-base min-h-[60px] mb-3"
        placeholder="Enter Sanskrit text"
        value={value}
        onChangeText={onChangeText}
        multiline
      />
      <Pressable
        className="bg-primary-500 p-3 rounded-lg items-center"
        onPress={onTranslate}
        disabled={disabled}
        accessibilityState={{ disabled }}
        testID="translate-button"
      >
        <Text className="text-white text-base font-semibold">Translate</Text>
      </Pressable>
    </View>
  );
}
