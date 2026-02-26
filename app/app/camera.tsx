import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { CameraView } from 'expo-camera';

export default function Camera() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

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

  if (photoUri) {
    return (
      <View style={styles.container} testID="photo-preview">
        <Image
          source={{ uri: photoUri }}
          style={styles.previewImage}
          testID="preview-image"
        />
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
});
