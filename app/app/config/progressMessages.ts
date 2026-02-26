import { ProgressState } from '../types/camera.types';

export const PROGRESS_MESSAGES: Record<ProgressState, string> = {
  idle: '',
  uploading: 'Uploading image...',
  ocr: 'Reading Devanagari text...',
  translating: 'Translating...',
  complete: '',
};

export function getProgressMessage(state: ProgressState): string {
  return PROGRESS_MESSAGES[state];
}
