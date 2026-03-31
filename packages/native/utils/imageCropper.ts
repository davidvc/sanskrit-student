import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

/** Port: device capability for cropping an image to a region of interest. */
export interface ImageCropperPort {
  crop(
    uri: string,
    region: CropRegion,
    imageSize: ImageSize,
    containerSize: ImageSize
  ): Promise<string>;
}

/**
 * Converts a crop region expressed in display-space pixels to image-space pixels.
 *
 * Display-space coordinates come naturally from gesture handlers; image-space
 * coordinates are required by expo-image-manipulator.
 */
export function toImageSpaceCrop(
  region: CropRegion,
  imageSize: ImageSize,
  containerSize: ImageSize
): CropRegion {
  const scaleX = imageSize.width / containerSize.width;
  const scaleY = imageSize.height / containerSize.height;
  return {
    x: Math.round(region.x * scaleX),
    y: Math.round(region.y * scaleY),
    width: Math.round(region.width * scaleX),
    height: Math.round(region.height * scaleY),
  };
}

/** Adapter: implements ImageCropperPort using expo-image-manipulator. */
export class ExpoImageCropperAdapter implements ImageCropperPort {
  async crop(
    uri: string,
    region: CropRegion,
    imageSize: ImageSize,
    containerSize: ImageSize
  ): Promise<string> {
    const imageCrop = toImageSpaceCrop(region, imageSize, containerSize);
    const result = await manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: imageCrop.x,
            originY: imageCrop.y,
            width: imageCrop.width,
            height: imageCrop.height,
          },
        },
      ],
      { compress: 0.9, format: SaveFormat.JPEG }
    );
    return result.uri;
  }
}
