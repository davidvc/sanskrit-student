import ImageCropPicker from 'react-native-image-crop-picker';

/** Port: device capability for presenting a crop UI and returning the cropped image URI. */
export interface ImageCropperPort {
  openAndCrop(uri: string): Promise<string | null>;
}

/** Adapter: implements ImageCropperPort using react-native-image-crop-picker. */
export class ImageCropPickerAdapter implements ImageCropperPort {
  async openAndCrop(uri: string): Promise<string | null> {
    try {
      const result = await ImageCropPicker.openCropper({
        path: uri,
        freeStyleCropEnabled: true,
        mediaType: 'photo',
      });
      return result.path;
    } catch (e: any) {
      if (e?.code === 'E_PICKER_CANCELLED') return null;
      throw e;
    }
  }
}
