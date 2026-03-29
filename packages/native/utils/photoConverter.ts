export interface ReactNativeFileObject {
  uri: string;
  name: string;
  type: string;
}

/**
 * Converts a photo URI to a React Native file object suitable for upload via
 * apollo-upload-client. Using fetch+blob+File is unreliable on Android/Hermes,
 * so we pass the URI directly and let React Native's networking layer read it.
 */
export function convertPhotoToFile(uri: string): ReactNativeFileObject {
  return { uri, name: 'photo.jpg', type: 'image/jpeg' };
}
