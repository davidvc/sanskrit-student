/**
 * Handle representing a stored image.
 */
export interface ImageHandle {
  /** Unique identifier for the stored image */
  id: string;

  /** Image file size in bytes */
  size: number;

  /** MIME type (e.g., 'image/png') */
  mimetype: string;

  /** Additional metadata (e.g., filename, storage path) */
  metadata?: Record<string, unknown>;
}

/**
 * File upload from GraphQL.
 */
export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream?: () => NodeJS.ReadableStream;
  // For testing: allow direct buffer
  _buffer?: Buffer;
}

/**
 * Port interface for image storage strategies.
 *
 * Abstracts how uploaded images are stored and retrieved during processing.
 * Implementations may use in-memory storage, temp files, or cloud storage.
 */
export interface ImageStorageStrategy {
  /**
   * Store an uploaded image and return a handle.
   *
   * @param upload - File upload from GraphQL
   * @returns Handle for retrieving the image later
   */
  store(upload: FileUpload): Promise<ImageHandle>;

  /**
   * Retrieve image data for processing.
   *
   * @param handle - Image handle from store()
   * @returns Image buffer
   */
  retrieve(handle: ImageHandle): Promise<Buffer>;

  /**
   * Clean up stored image.
   *
   * Called after processing completes (even on error).
   *
   * @param handle - Image handle to clean up
   */
  cleanup(handle: ImageHandle): Promise<void>;
}
