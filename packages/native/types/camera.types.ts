export type ProgressState = 'idle' | 'uploading' | 'ocr' | 'translating' | 'complete';

export interface CapturedPhoto {
  uri: string;
  width?: number;
  height?: number;
}
