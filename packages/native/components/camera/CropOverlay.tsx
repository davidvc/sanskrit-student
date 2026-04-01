import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import type { CropRegion } from '../../utils/imageCropper';

const MIN_SIZE = 100;
const HANDLE_SIZE = 28;

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  cropRegion: CropRegion;
  onCropChange: (region: CropRegion) => void;
}

/** Pure UI component: renders a draggable, resizable crop rectangle over the photo preview. */
export function CropOverlay({
  containerWidth,
  containerHeight,
  cropRegion,
  onCropChange,
}: CropOverlayProps) {
  const x = useSharedValue(cropRegion.x);
  const y = useSharedValue(cropRegion.y);
  const w = useSharedValue(cropRegion.width);
  const h = useSharedValue(cropRegion.height);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  const notifyChange = useCallback(
    (region: CropRegion) => onCropChange(region),
    [onCropChange]
  );

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  /** Pan gesture: moves the entire crop box. */
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) => {
      x.value = clamp(
        startX.value + e.translationX,
        0,
        containerWidth - w.value
      );
      y.value = clamp(
        startY.value + e.translationY,
        0,
        containerHeight - h.value
      );
    })
    .onEnd(() => {
      runOnJS(notifyChange)({
        x: x.value,
        y: y.value,
        width: w.value,
        height: h.value,
      });
    });

  const makeCornerGesture = (corner: 'tl' | 'tr' | 'bl' | 'br') =>
    Gesture.Pan()
      .onStart(() => {
        startX.value = x.value;
        startY.value = y.value;
        startW.value = w.value;
        startH.value = h.value;
      })
      .onUpdate((e) => {
        const dx = e.translationX;
        const dy = e.translationY;

        if (corner === 'tl') {
          const newW = clamp(startW.value - dx, MIN_SIZE, startX.value + startW.value);
          const newH = clamp(startH.value - dy, MIN_SIZE, startY.value + startH.value);
          x.value = startX.value + startW.value - newW;
          y.value = startY.value + startH.value - newH;
          w.value = newW;
          h.value = newH;
        } else if (corner === 'tr') {
          w.value = clamp(startW.value + dx, MIN_SIZE, containerWidth - x.value);
          const newH = clamp(startH.value - dy, MIN_SIZE, startY.value + startH.value);
          y.value = startY.value + startH.value - newH;
          h.value = newH;
        } else if (corner === 'bl') {
          const newW = clamp(startW.value - dx, MIN_SIZE, startX.value + startW.value);
          x.value = startX.value + startW.value - newW;
          w.value = newW;
          h.value = clamp(startH.value + dy, MIN_SIZE, containerHeight - y.value);
        } else {
          w.value = clamp(startW.value + dx, MIN_SIZE, containerWidth - x.value);
          h.value = clamp(startH.value + dy, MIN_SIZE, containerHeight - y.value);
        }
      })
      .onEnd(() => {
        runOnJS(notifyChange)({
          x: x.value,
          y: y.value,
          width: w.value,
          height: h.value,
        });
      });

  const tlGesture = makeCornerGesture('tl');
  const trGesture = makeCornerGesture('tr');
  const blGesture = makeCornerGesture('bl');
  const brGesture = makeCornerGesture('br');

  const boxStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    width: w.value,
    height: h.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} testID="crop-overlay">
      {/* Dark mask */}
      <View
        style={[StyleSheet.absoluteFill, styles.mask]}
        pointerEvents="none"
      />

      {/* Crop box */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[boxStyle, styles.cropBox]}>
          {/* Clear the interior */}
          <View style={[StyleSheet.absoluteFill, styles.cropInterior]} />

          {/* Corner handles */}
          <GestureDetector gesture={tlGesture}>
            <View style={[styles.handle, styles.handleTL]} />
          </GestureDetector>
          <GestureDetector gesture={trGesture}>
            <View style={[styles.handle, styles.handleTR]} />
          </GestureDetector>
          <GestureDetector gesture={blGesture}>
            <View style={[styles.handle, styles.handleBL]} />
          </GestureDetector>
          <GestureDetector gesture={brGesture}>
            <View style={[styles.handle, styles.handleBR]} />
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cropBox: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  cropInterior: {
    backgroundColor: 'transparent',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  handleTL: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  handleTR: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  handleBL: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  handleBR: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
});
