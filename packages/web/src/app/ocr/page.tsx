'use client';

import { useReducer, useRef } from 'react';
import { useTranslateSutraFromImageMutation } from '@sanskrit-student/shared';
import TranslationResult from '@/components/translation/TranslationResult';

type OcrState =
  | { status: 'idle' }
  | { status: 'selected'; file: File; previewUrl: string }
  | { status: 'loading' }
  | { status: 'success'; extractedText: string; ocrConfidence: number; ocrWarnings: string[]; result: { originalText: string[]; iastText: string[]; words: Array<{ word: string; meanings: string[] }>; alternativeTranslations?: string[] | null } }
  | { status: 'error'; message: string };

type OcrAction =
  | { type: 'FILE_SELECTED'; file: File; previewUrl: string }
  | { type: 'UPLOAD_STARTED' }
  | { type: 'UPLOAD_SUCCEEDED'; extractedText: string; ocrConfidence: number; ocrWarnings: string[]; result: { originalText: string[]; iastText: string[]; words: Array<{ word: string; meanings: string[] }>; alternativeTranslations?: string[] | null } }
  | { type: 'UPLOAD_FAILED'; message: string }
  | { type: 'RESET' };

function ocrReducer(state: OcrState, action: OcrAction): OcrState {
  switch (action.type) {
    case 'FILE_SELECTED':
      return { status: 'selected', file: action.file, previewUrl: action.previewUrl };
    case 'UPLOAD_STARTED':
      return { status: 'loading' };
    case 'UPLOAD_SUCCEEDED':
      return {
        status: 'success',
        extractedText: action.extractedText,
        ocrConfidence: action.ocrConfidence,
        ocrWarnings: action.ocrWarnings,
        result: action.result,
      };
    case 'UPLOAD_FAILED':
      return { status: 'error', message: action.message };
    case 'RESET':
      return { status: 'idle' };
    default:
      return state;
  }
}

/**
 * OCR Upload page — allows users to upload an image of Devanagari text for translation.
 */
export default function OcrPage() {
  const [state, dispatch] = useReducer(ocrReducer, { status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [translateSutraFromImage] = useTranslateSutraFromImageMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    dispatch({ type: 'FILE_SELECTED', file, previewUrl });
  };

  const handleUpload = async () => {
    if (state.status !== 'selected') return;

    dispatch({ type: 'UPLOAD_STARTED' });

    try {
      const result = await translateSutraFromImage({ variables: { image: state.file } });
      const data = result.data?.translateSutraFromImage;

      if (!data) {
        dispatch({ type: 'UPLOAD_FAILED', message: 'No result returned from server.' });
        return;
      }

      dispatch({
        type: 'UPLOAD_SUCCEEDED',
        extractedText: data.extractedText,
        ocrConfidence: data.ocrConfidence,
        ocrWarnings: data.ocrWarnings ?? [],
        result: {
          originalText: data.originalText,
          iastText: data.iastText,
          words: data.words,
          alternativeTranslations: data.alternativeTranslations,
        },
      });
    } catch (err) {
      dispatch({ type: 'UPLOAD_FAILED', message: err instanceof Error ? err.message : 'Upload failed.' });
    }
  };

  const handleReset = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    dispatch({ type: 'RESET' });
  };

  const handleCopyIast = async () => {
    if (state.status !== 'success') return;
    try {
      await navigator.clipboard.writeText(state.result.iastText.join('\n'));
    } catch {
      // clipboard access denied — silently ignore
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Photograph Sanskrit Text</h1>

      {state.status !== 'success' && (
        <section className="mb-6">
          <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select an image of Devanagari text
          </label>
          <input
            id="image-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={state.status === 'loading'}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
          />
        </section>
      )}

      {state.status === 'selected' && (
        <section className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.previewUrl}
            alt="Selected image preview"
            className="w-full rounded-lg border border-gray-200 mb-4 max-h-80 object-contain bg-gray-50"
          />
          <button
            onClick={handleUpload}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Upload and Translate
          </button>
        </section>
      )}

      {state.status === 'loading' && (
        <p className="text-center text-gray-500 py-8">Reading and translating text…</p>
      )}

      {state.status === 'error' && (
        <div>
          <p role="alert" className="text-red-600 py-2 mb-4">Error: {state.message}</p>
          <button
            onClick={handleReset}
            className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {state.status === 'success' && (
        <section>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Extracted text:</span> {state.extractedText}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              OCR confidence: {Math.round(state.ocrConfidence * 100)}%
            </p>
            {state.ocrWarnings.length > 0 && (
              <ul className="mt-2 text-sm text-amber-700">
                {state.ocrWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>

          <TranslationResult data={state.result} onCopyIast={handleCopyIast} />

          <button
            onClick={handleReset}
            className="mt-6 bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Upload Another Image
          </button>
        </section>
      )}
    </main>
  );
}
