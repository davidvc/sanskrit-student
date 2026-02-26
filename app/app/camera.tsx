import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslateSutraFromImageMutation } from '../lib/graphql/generated';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProgressState = 'idle' | 'uploading' | 'ocr' | 'translating' | 'complete';

export default function Camera() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>('idle');
  const [showLightingTip, setShowLightingTip] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  const [translateSutraFromImage] = useTranslateSutraFromImageMutation();

  // Check first-use flag and show lighting tip if needed
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const checkFirstUse = async () => {
      try {
        const tipShown = await AsyncStorage.getItem('camera_lighting_tip_shown');
        if (!tipShown) {
          setShowLightingTip(true);
          AsyncStorage.setItem('camera_lighting_tip_shown', 'true');

          // Auto-dismiss after 3 seconds
          timer = setTimeout(() => {
            setShowLightingTip(false);
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking first-use flag:', error);
      }
    };

    checkFirstUse();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Zoom state using reanimated
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const baseScale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      const newScale = Math.min(Math.max(ctx.startScale * event.scale, 1), 3);
      scale.value = newScale;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    },
    onEnd: () => {
      baseScale.value = scale.value;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ],
    };
  });

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
    // Reset zoom state
    scale.value = withTiming(1);
    baseScale.value = 1;
    focalX.value = 0;
    focalY.value = 0;

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
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container} testID="photo-preview">
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.View style={[styles.previewImageContainer, animatedStyle]}>
              <Animated.Image
                source={{ uri: photoUri }}
                style={styles.previewImage}
                testID="preview-image"
                // @ts-ignore - custom prop for testing
                zoomEnabled={true}
              />
            </Animated.View>
          </PinchGestureHandler>
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
      </GestureHandlerRootView>
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
      {showLightingTip && (
        <View style={styles.lightingTipContainer} testID="lighting-tip-container">
          <Text style={styles.lightingTipText}>
            💡 Tip: Use bright, even lighting for best results
          </Text>
          <TouchableOpacity
            style={styles.dismissTipButton}
            onPress={() => setShowLightingTip(false)}
            testID="dismiss-tip-button"
          >
            <Text style={styles.dismissTipButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
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
  previewImageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  lightingTipContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    paddingRight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  lightingTipText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  dismissTipButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissTipButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
});
