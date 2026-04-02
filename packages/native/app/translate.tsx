import { useReducer, useMemo } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useTranslateSutraQuery } from '@sanskrit-student/shared';
import SutraInput from '../components/translation/SutraInput';
import TranslationResult from '../components/translation/TranslationResult';

type CameraResult = {
  originalText: string[];
  iastText: string[];
  words: Array<{ word: string; meanings: string[] }>;
  alternativeTranslations: string[];
};

function toJsonString(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? []);
}

function parseCameraParams(params: Record<string, string | string[]>): CameraResult | null {
  if (params.fromCamera !== 'true') return null;
  try {
    return {
      originalText: JSON.parse(toJsonString(params.originalText)),
      iastText: JSON.parse(toJsonString(params.iastText)),
      words: JSON.parse(toJsonString(params.words)),
      alternativeTranslations: JSON.parse(toJsonString(params.alternativeTranslations)),
    };
  } catch {
    return null;
  }
}

// Translation state machine
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
  | { type: 'VALIDATION_FAILED'; error: string }
  | { type: 'TRANSLATION_STARTED'; sutra: string }
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
        return {
          status: 'validationError',
          inputText: state.inputText,
          error: 'Please enter Sanskrit text to translate'
        };
      }
      return {
        status: 'loading',
        inputText: state.inputText,
        sutra: state.inputText
      };

    case 'VALIDATION_FAILED':
      return {
        status: 'validationError',
        inputText: state.inputText,
        error: action.error
      };

    case 'TRANSLATION_STARTED':
      return {
        status: 'loading',
        inputText: state.inputText,
        sutra: action.sutra
      };

    case 'TRANSLATION_SUCCEEDED':
      if (state.status === 'loading') {
        return {
          status: 'success',
          inputText: state.inputText,
          sutra: state.sutra
        };
      }
      return state;

    case 'TRANSLATION_FAILED':
      if (state.status === 'loading') {
        return {
          status: 'error',
          inputText: state.inputText,
          sutra: state.sutra,
          error: action.error
        };
      }
      return state;

    case 'COPY_SUCCEEDED':
      if (state.status === 'success') {
        return {
          status: 'copied',
          inputText: state.inputText,
          sutra: state.sutra
        };
      }
      return state;

    case 'COPY_CONFIRMATION_CLEARED':
      if (state.status === 'copied') {
        return {
          status: 'success',
          inputText: state.inputText,
          sutra: state.sutra
        };
      }
      return state;

    default:
      return state;
  }
}

export default function Translate() {
  const params = useLocalSearchParams();
  const cameraResult = useMemo(() => parseCameraParams(params as Record<string, string | string[]>), [params]);
  const [state, dispatch] = useReducer(translationReducer, { status: 'idle', inputText: '' });

  const sutraToTranslate = state.status === 'loading' || state.status === 'success' || state.status === 'error' || state.status === 'copied'
    ? state.sutra
    : null;

  const { data, loading, error } = useTranslateSutraQuery({
    variables: { sutra: sutraToTranslate || '' },
    skip: !sutraToTranslate,
    onCompleted: () => {
      dispatch({ type: 'TRANSLATION_SUCCEEDED' });
    },
    onError: (error) => {
      dispatch({ type: 'TRANSLATION_FAILED', error: error.message });
    },
  });

  const handleTranslate = () => {
    dispatch({ type: 'TRANSLATE_REQUESTED' });
  };

  const handleCopyIast = async () => {
    const iastText = cameraResult?.iastText ?? data?.translateSutra?.iastText;
    if (iastText) {
      try {
        await Clipboard.setStringAsync(iastText.join('\n'));
        dispatch({ type: 'COPY_SUCCEEDED' });

        // Auto-hide confirmation after 3 seconds
        setTimeout(() => dispatch({ type: 'COPY_CONFIRMATION_CLEARED' }), 3000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const isLoading = state.status === 'loading';
  const showValidationError = state.status === 'validationError';
  const showServerError = state.status === 'error';
  const showCopyConfirmation = state.status === 'copied';
  const queryResult = (state.status === 'success' || state.status === 'copied') ? data?.translateSutra : null;
  const resultData = cameraResult ?? queryResult ?? null;

  return (
    <ScrollView style={styles.container}>
      {!cameraResult && (
        <SutraInput
          value={state.inputText}
          onChangeText={(text) => dispatch({ type: 'INPUT_CHANGED', text })}
          onTranslate={handleTranslate}
          disabled={isLoading}
        />
      )}

      {isLoading && <Text style={styles.loading}>Loading...</Text>}
      {showValidationError && <Text style={styles.error}>{state.error}</Text>}
      {showServerError && <Text style={styles.error}>Error: {state.error}</Text>}
      {showCopyConfirmation && <Text style={styles.success}>Copied to clipboard</Text>}

      {resultData && (
        <TranslationResult
          data={resultData}
          onCopyIast={handleCopyIast}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loading: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
  },
  error: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
    color: '#ff0000',
  },
  success: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
    color: '#00aa00',
  },
});
