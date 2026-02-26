import { View, Text, StyleSheet } from 'react-native';

export default function Camera() {
  return (
    <View style={styles.container}>
      <View style={styles.frameOverlay} testID="camera-frame-overlay" />
      <Text style={styles.guidanceText}>Best results: photograph 2-6 lines</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  frameOverlay: {
    width: '70%',
    aspectRatio: 4 / 3,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
  },
  guidanceText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});
