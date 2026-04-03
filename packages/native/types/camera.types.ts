export type ProgressState = 'idle' | 'uploading' | 'ocr' | 'translating' | 'complete' | 'processing';

export interface CapturedPhoto {
  uri: string;
  width?: number;
  height?: number;
}
