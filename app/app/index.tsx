import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sanskrit Student</Text>
      <Text style={styles.subtitle}>Translate Sanskrit text with AI</Text>

      <View style={styles.links}>
        <Link href="/translate" style={styles.button}>
          <Text style={styles.buttonText}>Start Translating</Text>
        </Link>

        <Link href="/camera" style={[styles.button, styles.buttonSecondary]}>
          <Text style={styles.buttonText}>Camera (Coming Soon)</Text>
        </Link>

        <Link href="/history" style={[styles.button, styles.buttonSecondary]}>
          <Text style={styles.buttonText}>History (Coming Soon)</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  links: {
    gap: 15,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#64748b',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
