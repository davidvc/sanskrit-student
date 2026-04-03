import { useState, useRef } from 'react';
import type { RefObject } from 'react';
import type { CameraView } from 'expo-camera';
import { ImageCropPickerAdapter } from '../utils/imageCropper';
import type { ImageCropperPort } from '../utils/imageCropper';

export interface CameraCapture {
  cameraRef: RefObject<CameraView | null>;
  croppedPhotoUri: string | null;
  isCapturing: boolean;
  captureAndCrop: () => Promise<void>;
  retake: () => void;
}

const imageCropper: ImageCropperPort = new ImageCropPickerAdapter();

/** Manages camera capture and native crop flow. */
export function useCameraCapture(): CameraCapture {
  const cameraRef = useRef<CameraView | null>(null);
  const [croppedPhotoUri, setCroppedPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAndCrop = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const result = await (cameraRef.current as any).takePictureAsync();
      const cropped = await imageCropper.openAndCrop(result.uri);
      if (cropped) setCroppedPhotoUri(cropped);
    } finally {
      setIsCapturing(false);
    }
  };

  const retake = () => setCroppedPhotoUri(null);

  return { cameraRef, croppedPhotoUri, isCapturing, captureAndCrop, retake };
}
