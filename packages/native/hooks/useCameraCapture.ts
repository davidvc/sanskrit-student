import { useState, useRef } from 'react';
import type { RefObject } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { CameraView } from 'expo-camera';
import type { CropRegion, ImageSize } from '../utils/imageCropper';

export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

export interface CropState {
  cropRegion: CropRegion | null;
  containerSize: ImageSize | null;
  imageSize: ImageSize | null;
  onContainerLayout: (event: LayoutChangeEvent) => void;
  onImageLoad: (event: any) => void;
  onCropChange: (region: CropRegion) => void;
}

export interface CameraCapture {
  cameraRef: RefObject<CameraView | null>;
  photo: CapturedPhoto | null;
  isCapturing: boolean;
  cropState: CropState;
  capture: () => Promise<void>;
  retake: () => void;
}

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

/** Manages camera ref, photo capture, retake, and crop region state. */
export function useCameraCapture(): CameraCapture {
  const cameraRef = useRef<CameraView | null>(null);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null);
  const [containerSize, setContainerSize] = useState<ImageSize | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);

  const capture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const result = await (cameraRef.current as any).takePictureAsync();
      setPhoto({
        uri: result.uri,
        width: result.width ?? 0,
        height: result.height ?? 0,
      });
      if (result.width && result.height) {
        setImageSize({ width: result.width, height: result.height });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
    setCropRegion(null);
    setContainerSize(null);
    setImageSize(null);
  };

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
    setCropRegion(defaultCropRegion(width, height));
  };

  const onImageLoad = (event: any) => {
    const source = event?.nativeEvent?.source;
    if (source?.width && source?.height) {
      setImageSize({ width: source.width, height: source.height });
    }
  };

  return {
    cameraRef,
    photo,
    isCapturing,
    cropState: {
      cropRegion,
      containerSize,
      imageSize,
      onContainerLayout,
      onImageLoad,
      onCropChange: setCropRegion,
    },
    capture,
    retake,
  };
}
