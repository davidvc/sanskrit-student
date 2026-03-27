'use client';

import { useEffect, useReducer } from 'react';
import { useTranslateSutraQuery } from '@sanskrit-student/shared';
import SutraInput from '@/components/translation/SutraInput';
import TranslationResult from '@/components/translation/TranslationResult';

type TranslationState =
  | { status: 'idle'; inputText: string }
  | { status: 'validationError'; inputText: string; error: string }
  | { status: 'loading'; inputText: string; sutra: string }
  | { status: 'success'; inputText: string; sutra: string }
  | { status: 'error'; inputText: string; sutra: string; error: string }
  | { status: 'copied'; inputText: string; sutra: string };

type TranslationAction =
  | { type: 'INPUT_CHANGED'; text: string }
  | { type: 'TRANSLATE_REQUESTED' }
  | { type: 'TRANSLATION_SUCCEEDED' }
  | { type: 'TRANSLATION_FAILED'; error: string }
  | { type: 'COPY_SUCCEEDED' }
  | { type: 'COPY_CONFIRMATION_CLEARED' };

function translationReducer(state: TranslationState, action: TranslationAction): TranslationState {
  switch (action.type) {
    case 'INPUT_CHANGED':
      return { ...state, inputText: action.text };

    case 'TRANSLATE_REQUESTED':
      if (!state.inputText.trim()) {
        return { status: 'validationError', inputText: state.inputText, error: 'Please enter Sanskrit text to translate' };
      }
      return { status: 'loading', inputText: state.inputText, sutra: state.inputText };

    case 'TRANSLATION_SUCCEEDED':
      return state.status === 'loading'
        ? { status: 'success', inputText: state.inputText, sutra: state.sutra }
        : state;

    case 'TRANSLATION_FAILED':
      return state.status === 'loading'
        ? { status: 'error', inputText: state.inputText, sutra: state.sutra, error: action.error }
        : state;

    case 'COPY_SUCCEEDED':
      return state.status === 'success'
        ? { status: 'copied', inputText: state.inputText, sutra: state.sutra }
        : state;

    case 'COPY_CONFIRMATION_CLEARED':
      return state.status === 'copied'
        ? { status: 'success', inputText: state.inputText, sutra: state.sutra }
        : state;

    default:
      return state;
  }
}

/**
 * Translate page — accepts Sanskrit text input and displays word-by-word translation.
 */
export default function TranslatePage() {
  const [state, dispatch] = useReducer(translationReducer, { status: 'idle', inputText: '' });

  const sutraToTranslate =
    state.status === 'loading' || state.status === 'success' || state.status === 'error' || state.status === 'copied'
      ? state.sutra
      : null;

  const { data, loading: queryLoading, error: queryError } = useTranslateSutraQuery({
    variables: { sutra: sutraToTranslate ?? '' },
    skip: !sutraToTranslate,
  });

  useEffect(() => {
    if (!queryLoading && sutraToTranslate && data) {
      dispatch({ type: 'TRANSLATION_SUCCEEDED' });
    }
  }, [data, queryLoading, sutraToTranslate]);

  useEffect(() => {
    if (queryError && sutraToTranslate) {
      dispatch({ type: 'TRANSLATION_FAILED', error: queryError.message });
    }
  }, [queryError, sutraToTranslate]);

  const handleCopyIast = async () => {
    if (data?.translateSutra?.iastText) {
      try {
        await navigator.clipboard.writeText(data.translateSutra.iastText.join('\n'));
        dispatch({ type: 'COPY_SUCCEEDED' });
        setTimeout(() => dispatch({ type: 'COPY_CONFIRMATION_CLEARED' }), 3000);
      } catch {
        // clipboard access denied — silently ignore
      }
    }
  };

  const isLoading = state.status === 'loading';
  const showResults = (state.status === 'success' || state.status === 'copied') && data?.translateSutra;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Translate Sanskrit</h1>

      <SutraInput
        value={state.inputText}
        onChange={(text) => dispatch({ type: 'INPUT_CHANGED', text })}
        onTranslate={() => dispatch({ type: 'TRANSLATE_REQUESTED' })}
        disabled={isLoading}
      />

      {isLoading && <p className="text-center text-gray-500 py-4">Translating…</p>}
      {state.status === 'validationError' && (
        <p role="alert" className="text-red-600 py-2">{state.error}</p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="text-red-600 py-2">Error: {state.error}</p>
      )}
      {state.status === 'copied' && (
        <p className="text-green-600 py-2">Copied to clipboard</p>
      )}

      {showResults && data?.translateSutra && (
        <TranslationResult data={data.translateSutra} onCopyIast={handleCopyIast} />
      )}
    </main>
  );
}
