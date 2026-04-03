import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslateSutraFromImageMutation } from '@sanskrit-student/shared';

export type OcrProgressState = 'idle' | 'processing' | 'error';

export interface OcrMutationState {
  progress: OcrProgressState;
  error: string | null;
  translate: (croppedUri: string) => Promise<void>;
}

/** Fires the OCR/translation mutation and tracks progress state. */
export function useOcrMutation(): OcrMutationState {
  const [progress, setProgress] = useState<OcrProgressState>('idle');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [translateSutraFromImage] = useTranslateSutraFromImageMutation();

  const translate = async (croppedUri: string) => {
    setProgress('processing');
    setError(null);

    try {
      const file = { uri: croppedUri, name: 'photo.jpg', type: 'image/jpeg' };
      const result = await translateSutraFromImage({ variables: { image: file } });

      const data = result.data?.translateSutraFromImage;
      if (data) {
        router.push({
          pathname: '/translate',
          params: {
            fromCamera: true,
            ocrConfidence: data.ocrConfidence,
            extractedText: data.extractedText,
            originalText: JSON.stringify(data.originalText),
            iastText: JSON.stringify(data.iastText),
            words: JSON.stringify(data.words),
            alternativeTranslations: JSON.stringify(data.alternativeTranslations),
            ocrWarnings: JSON.stringify(data.ocrWarnings || []),
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Translation failed:', err);
      setError(message);
      setProgress('error');
    }
  };

  return { progress, error, translate };
}
