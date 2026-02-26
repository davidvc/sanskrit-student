import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslateSutraFromImageMutation } from '../lib/graphql/generated';

type ProgressState = 'idle' | 'uploading' | 'ocr' | 'translating' | 'complete';

export default function Camera() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>('idle');
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  const [translateSutraFromImage] = useTranslateSutraFromImageMutation();

  const handleShutterPress = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setProgressState('idle');
  };

  const handleUsePhoto = async () => {
    if (!photoUri) return;

    try {
      // Start uploading
      setProgressState('uploading');

      // Simulate upload completion and transition to OCR
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgressState('ocr');

      // Simulate OCR completion and transition to translation
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgressState('translating');

      // Create a mock File object from the photo URI
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

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
            fromCamera: true,
            ocrConfidence: data.ocrConfidence,
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
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        testID="camera-view"
      >
        <View style={styles.frameOverlay} testID="camera-frame-overlay" />
        <Text style={styles.guidanceText}>Best results: photograph 2-6 lines</Text>
      </CameraView>
      <TouchableOpacity
        style={styles.shutterButton}
        onPress={handleShutterPress}
        disabled={isCapturing}
        accessibilityState={{ disabled: isCapturing }}
        testID="shutter-button"
      >
        <View style={styles.shutterButtonInner} />
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
  camera: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  shutterButton: {
    position: 'absolute',
    bottom: 40,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
