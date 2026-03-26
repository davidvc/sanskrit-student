import { describe, it, expect } from 'vitest';
import {
  DictionaryDefinition,
  WordEntry,
  TranslationResult,
  TranslationError,
  OcrTranslationResult,
} from '@sanskrit-student/shared';

describe('Shared domain types', () => {
  it('exports WordEntry with all required and optional fields', () => {
    const entry: WordEntry = {
      word: 'dharma',
      meanings: ['duty', 'righteousness'],
      dictionaryDefinitions: [{ source: 'MW', definition: 'law, duty' }],
      contextualNote: 'Refers to cosmic order',
    };

    expect(entry.word).toBe('dharma');
    expect(entry.meanings).toHaveLength(2);
    expect(entry.dictionaryDefinitions).toBeDefined();
    expect(entry.contextualNote).toBeDefined();
  });

  it('exports TranslationResult with word entries', () => {
    const result: TranslationResult = {
      originalText: ['dharmaḥ'],
      iastText: ['dharmaḥ'],
      words: [{ word: 'dharma', meanings: ['duty'] }],
      alternativeTranslations: ['righteousness'],
      warnings: ['Service degraded'],
    };

    expect(result.originalText).toHaveLength(1);
    expect(result.words[0].word).toBe('dharma');
    expect(result.alternativeTranslations).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });

  it('exports TranslationError as a proper Error subclass', () => {
    const error = new TranslationError('invalid input');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TranslationError);
    expect(error.name).toBe('TranslationError');
    expect(error.message).toBe('invalid input');
  });

  it('exports OcrTranslationResult extending TranslationResult', () => {
    const result: OcrTranslationResult = {
      originalText: ['dharmaḥ'],
      iastText: ['dharmaḥ'],
      words: [{ word: 'dharma', meanings: ['duty'] }],
      ocrConfidence: 0.95,
      extractedText: 'dharmaḥ',
      ocrWarnings: ['Low contrast detected'],
    };

    expect(result.ocrConfidence).toBe(0.95);
    expect(result.extractedText).toBe('dharmaḥ');
    expect(result.ocrWarnings).toHaveLength(1);
    // Verify it also has TranslationResult fields
    expect(result.words).toHaveLength(1);
  });

  it('exports DictionaryDefinition interface', () => {
    const def: DictionaryDefinition = {
      source: 'PWG Dictionary',
      definition: 'law, custom, duty',
    };

    expect(def.source).toBe('PWG Dictionary');
    expect(def.definition).toContain('law');
  });
});
