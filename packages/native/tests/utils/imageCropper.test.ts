import { describe, it, expect } from '@jest/globals';
import { toImageSpaceCrop } from '../../utils/imageCropper';

describe('ExpoImageCropperAdapter coordinate conversion', () => {
  it('scales x, y, width, height by image/display ratio', () => {
    const result = toImageSpaceCrop(
      { x: 30, y: 40, width: 120, height: 160 },
      { width: 1200, height: 1600 },
      { width: 300, height: 400 }
    );
    expect(result).toEqual({ x: 120, y: 160, width: 480, height: 640 });
  });

  it('handles non-square scale factors independently on each axis', () => {
    const result = toImageSpaceCrop(
      { x: 80, y: 60, width: 200, height: 150 },
      { width: 2000, height: 900 },
      { width: 400, height: 300 }
    );
    expect(result).toEqual({ x: 400, y: 180, width: 1000, height: 450 });
  });

  it('maps a full-image crop to full image dimensions', () => {
    const result = toImageSpaceCrop(
      { x: 0, y: 0, width: 300, height: 400 },
      { width: 1200, height: 1600 },
      { width: 300, height: 400 }
    );
    expect(result).toEqual({ x: 0, y: 0, width: 1200, height: 1600 });
  });

  it('correctly maps a region at the bottom-right corner', () => {
    const result = toImageSpaceCrop(
      { x: 150, y: 200, width: 150, height: 200 },
      { width: 1200, height: 1600 },
      { width: 300, height: 400 }
    );
    expect(result).toEqual({ x: 600, y: 800, width: 600, height: 800 });
  });
});
