import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';

interface SutraInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onTranslate: () => void;
  disabled?: boolean;
}

export default function SutraInput({ value, onChangeText, onTranslate, disabled }: SutraInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter Sanskrit text"
        value={value}
        onChangeText={onChangeText}
        multiline
      />
      <Pressable
        style={styles.button}
        onPress={onTranslate}
        disabled={disabled}
        accessibilityState={{ disabled }}
        testID="translate-button"
      >
        <Text style={styles.buttonText}>Translate</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
