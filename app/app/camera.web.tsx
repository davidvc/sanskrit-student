import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslateSutraFromImageMutation } from '../lib/graphql/generated';

type ProgressState = 'idle' | 'uploading' | 'ocr' | 'translating' | 'complete';

/**
 * Web version of the camera component.
 * Uses HTML5 file input to access camera on mobile browsers.
 *
 * On mobile browsers:
 * - Safari (iOS): Opens camera directly
 * - Chrome (Android): Opens camera directly
 *
 * On desktop browsers:
 * - Shows file picker (user can upload saved images)
 */
export default function CameraWeb() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<ProgressState>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [translateSutraFromImage] = useTranslateSutraFromImageMutation();

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setProgressState('idle');
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUsePhoto = async () => {
    if (!photoUri || !fileInputRef.current?.files?.[0]) return;

    try {
      // Start uploading
      setProgressState('uploading');

      // Simulate upload completion and transition to OCR
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgressState('ocr');

      // Simulate OCR completion and transition to translation
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgressState('translating');

      // Get the actual file
      const file = fileInputRef.current.files[0];

      // Execute the mutation
      const result = await translateSutraFromImage({
        variables: { image: file },
      });

      const data = result.data?.translateSutraFromImage;
      if (data) {
        // Navigate to translation screen with OCR results
        router.push({
          pathname: '/translate',
          params: {
            fromCamera: 'true',
            ocrConfidence: data.ocrConfidence.toString(),
            extractedText: data.extractedText,
            originalText: JSON.stringify(data.originalText),
            iastText: JSON.stringify(data.iastText),
            words: JSON.stringify(data.words),
            alternativeTranslations: JSON.stringify(data.alternativeTranslations),
            ocrWarnings: JSON.stringify(data.ocrWarnings || []),
          },
        });
      }
    } catch (error) {
      console.error('Translation failed:', error);
      setProgressState('idle');
    }
  };

  // Show progress messages
  if (progressState !== 'idle') {
    const progressMessages = {
      uploading: 'Uploading image...',
      ocr: 'Reading Devanagari text...',
      translating: 'Translating...',
      complete: '',
    };

    return (
      <View style={styles.container} testID="progress-view">
        <ActivityIndicator size="large" color="#007AFF" testID="upload-progress-indicator" />
        <Text style={styles.progressText}>{progressMessages[progressState]}</Text>
      </View>
    );
  }

  if (photoUri) {
    return (
      <View style={styles.container} testID="photo-preview">
        <Image
          source={{ uri: photoUri }}
          style={styles.previewImage}
          testID="preview-image"
          resizeMode="contain"
        />
        <View style={styles.previewControls}>
          <Text style={styles.qualityPrompt}>Is the text clear and in focus?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={handleRetake}
              testID="retake-button"
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.usePhotoButton]}
              onPress={handleUsePhoto}
              testID="use-photo-button"
            >
              <Text style={styles.buttonText}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hidden file input that triggers camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect as any}
      />

      <View style={styles.cameraPlaceholder}>
        <Text style={styles.instructionText}>
          📸 Take a photo of Devanagari text
        </Text>
        <Text style={styles.tipText}>
          {typeof window !== 'undefined' && /Mobile|Android|iPhone/i.test(window.navigator.userAgent)
            ? 'Your camera will open when you tap the button below'
            : 'Select an image file to upload'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleCameraClick}
        testID="camera-button"
      >
        <Text style={styles.captureButtonText}>
          {typeof window !== 'undefined' && /Mobile|Android|iPhone/i.test(window.navigator.userAgent)
            ? 'Open Camera'
            : 'Choose Image'}
        </Text>
      </TouchableOpacity>
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
  cameraPlaceholder: {
    width: '80%',
    maxWidth: 400,
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '70%',
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    paddingBottom: 40,
  },
  qualityPrompt: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  usePhotoButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});
