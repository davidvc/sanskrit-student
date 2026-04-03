import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLightingTip } from '../hooks/useLightingTip';
import { useCameraCapture } from '../hooks/useCameraCapture';
import { useOcrMutation } from '../hooks/useOcrMutation';
import { LightingTip } from '../components/camera/LightingTip';
import { ProgressView } from '../components/camera/ProgressView';

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const lightingTip = useLightingTip();
  const capture = useCameraCapture();
  const ocr = useOcrMutation();

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

  if (ocr.progress === 'processing') {
    return <ProgressView progressState="processing" />;
  }

  if (capture.croppedPhotoUri) {
    return (
      <View style={styles.container} testID="photo-preview">
        <View style={styles.previewControls}>
          {ocr.error && (
            <Text style={styles.errorText}>{ocr.error}</Text>
          )}
          <Text style={styles.qualityPrompt}>Ready to translate</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={capture.retake}
              testID="retake-button"
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.usePhotoButton]}
              onPress={() => ocr.translate(capture.croppedPhotoUri!)}
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
        ref={capture.cameraRef}
        style={styles.camera}
        testID="camera-view"
      >
        <View style={styles.frameOverlay} testID="camera-frame-overlay" />
        <Text style={styles.guidanceText}>Best results: photograph 2-6 lines</Text>
      </CameraView>
      <LightingTip visible={lightingTip.visible} onDismiss={lightingTip.dismiss} />
      <TouchableOpacity
        style={styles.shutterButton}
        onPress={capture.captureAndCrop}
        disabled={capture.isCapturing}
        accessibilityState={{ disabled: capture.isCapturing }}
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
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,59,48,0.15)',
    padding: 8,
    borderRadius: 6,
  },
});
