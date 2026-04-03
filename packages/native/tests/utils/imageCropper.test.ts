import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ImageCropPickerAdapter } from '../../utils/imageCropper';

jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: {
    openCropper: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: mockImageCropPicker } = require('react-native-image-crop-picker') as {
  default: { openCropper: jest.Mock }
};

describe('ImageCropPickerAdapter', () => {
  const adapter = new ImageCropPickerAdapter();

  beforeEach(() => jest.clearAllMocks());

  it('returns the cropped image path on success', async () => {
    mockImageCropPicker.openCropper.mockResolvedValue({ path: 'file://cropped.jpg' });
    const result = await adapter.openAndCrop('file://photo.jpg');
    expect(result).toBe('file://cropped.jpg');
    expect(mockImageCropPicker.openCropper).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'file://photo.jpg' })
    );
  });

  it('returns null when user cancels', async () => {
    const cancelError = Object.assign(new Error('cancelled'), { code: 'E_PICKER_CANCELLED' });
    mockImageCropPicker.openCropper.mockRejectedValue(cancelError);
    const result = await adapter.openAndCrop('file://photo.jpg');
    expect(result).toBeNull();
  });

  it('rethrows non-cancellation errors', async () => {
    const error = new Error('permission denied');
    mockImageCropPicker.openCropper.mockRejectedValue(error);
    await expect(adapter.openAndCrop('file://photo.jpg')).rejects.toThrow('permission denied');
  });
});
