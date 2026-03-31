import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslateSutraFromImageMutation } from '@sanskrit-student/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CropOverlay } from '../components/camera/CropOverlay';
import { ExpoImageCropperAdapter } from '../utils/imageCropper';
import type { CropRegion, ImageSize } from '../utils/imageCropper';

type ProgressState = 'idle' | 'uploading' | 'ocr' | 'translating' | 'complete';

const imageCropper = new ExpoImageCropperAdapter();

/** Computes the default crop region: centred rectangle at 80% of each dimension. */
function defaultCropRegion(containerWidth: number, containerHeight: number): CropRegion {
  const cropWidth = containerWidth * 0.8;
  const cropHeight = containerHeight * 0.8;
  return {
    x: (containerWidth - cropWidth) / 2,
    y: (containerHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>('idle');
  const [showLightingTip, setShowLightingTip] = useState(false);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [containerSize, setContainerSize] = useState<ImageSize | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const cameraRef = useRef<any>(null);
  const lightingTipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const [translateSutraFromImage] = useTranslateSutraFromImageMutation();

  // Check first-use flag and show lighting tip if needed
  useEffect(() => {
    const checkFirstUse = async () => {
      try {
        const tipShown = await AsyncStorage.getItem('camera_lighting_tip_shown');
        if (!tipShown) {
          setShowLightingTip(true);
          AsyncStorage.setItem('camera_lighting_tip_shown', 'true');

          // Auto-dismiss after 3 seconds
          lightingTipTimerRef.current = setTimeout(() => {
            setShowLightingTip(false);
            lightingTipTimerRef.current = null;
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking first-use flag:', error);
      }
    };

    checkFirstUse();

    return () => {
      if (lightingTipTimerRef.current) {
        clearTimeout(lightingTipTimerRef.current);
        lightingTipTimerRef.current = null;
      }
    };
  }, []);

  const handleShutterPress = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      if (photo.width && photo.height) {
        setImageSize({ width: photo.width, height: photo.height });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setCropRegion(null);
    setContainerSize(null);
    setImageSize(null);
    setProgressState('idle');
  };

  const handleTranslate = async () => {
    if (!photoUri) return;

    try {
      setProgressState('uploading');

      await new Promise(resolve => setTimeout(resolve, 100));
      setProgressState('ocr');

      await new Promise(resolve => setTimeout(resolve, 100));
      setProgressState('translating');

      let uploadUri = photoUri;
      if (cropRegion && imageSize && containerSize) {
        uploadUri = await imageCropper.crop(photoUri, cropRegion, imageSize, containerSize);
      }

      const file = { uri: uploadUri, name: 'photo.jpg', type: 'image/jpeg' };

      const result = await translateSutraFromImage({
        variables: { image: file },
      });

      const data = result.data?.translateSutraFromImage;
      if (data) {
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

  // Handle camera permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.progressText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Sanskrit Student needs access to your camera to photograph Devanagari text for translation.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            testID="request-camera-permission-button"
          >
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <View
          style={styles.previewImageContainer}
          testID="preview-image-container"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setContainerSize({ width, height });
            setCropRegion(defaultCropRegion(width, height));
          }}
        >
          <Image
            source={{ uri: photoUri }}
            style={styles.previewImage}
            testID="preview-image"
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              setImageSize({ width, height });
            }}
          />
          {cropRegion && containerSize && (
            <CropOverlay
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              cropRegion={cropRegion}
              onCropChange={setCropRegion}
            />
          )}
        </View>
        <View style={styles.previewControls}>
          <Text style={styles.qualityPrompt}>Select the region to translate</Text>
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
              onPress={handleTranslate}
              testID="use-photo-button"
            >
              <Text style={styles.buttonText}>Translate</Text>
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
      {showLightingTip && (
        <View style={styles.lightingTipContainer} testID="lighting-tip-container">
          <Text style={styles.lightingTipText}>
            💡 Tip: Use bright, even lighting for best results
          </Text>
          <TouchableOpacity
            style={styles.dismissTipButton}
            onPress={() => {
              if (lightingTipTimerRef.current) {
                clearTimeout(lightingTipTimerRef.current);
                lightingTipTimerRef.current = null;
              }
              setShowLightingTip(false);
            }}
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
  permissionContainer: {
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    maxWidth: 340,
    alignItems: 'center',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
