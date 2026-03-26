/**
 * Converts a photo URI to a File object suitable for upload
 * @param uri - The file:// URI of the photo
 * @returns A File object containing the photo data
 */
export async function convertPhotoToFile(uri: string): Promise<File> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}
