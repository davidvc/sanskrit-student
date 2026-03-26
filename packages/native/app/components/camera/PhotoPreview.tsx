import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

interface PhotoPreviewProps {
  photoUri: string;
  pinchHandler: any;
  animatedStyle: any;
  onRetake: () => void;
  onUsePhoto: () => void;
}

export function PhotoPreview({
  photoUri,
  pinchHandler,
  animatedStyle,
  onRetake,
  onUsePhoto,
}: PhotoPreviewProps) {
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container} testID="photo-preview">
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            <Animated.Image
              source={{ uri: photoUri }}
              style={styles.image}
              testID="preview-image"
              // @ts-ignore - custom prop for testing
              zoomEnabled={true}
            />
          </Animated.View>
        </PinchGestureHandler>
        <View style={styles.controls}>
          <Text style={styles.prompt}>Is the text clear and in focus?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={onRetake}
              testID="retake-button"
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.usePhotoButton]}
              onPress={onUsePhoto}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    paddingBottom: 40,
  },
  prompt: {
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
});
