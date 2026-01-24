/**
 * Common test assertions for Sanskrit translation acceptance tests.
 * Extracted to promote reuse across test files.
 */

import { expect } from 'vitest';
import { WordEntry } from '../../src/domain/types';

/**
 * Asserts that a word entry has a valid word string.
 */
export function expectValidWord(wordEntry: WordEntry): void {
  expect(wordEntry.word).toBeDefined();
  expect(typeof wordEntry.word).toBe('string');
  expect(wordEntry.word.length).toBeGreaterThan(0);
}

/**
 * Asserts that a word entry has at least one valid meaning.
 */
export function expectValidMeanings(wordEntry: WordEntry): void {
  expect(wordEntry.meanings).toBeInstanceOf(Array);
  expect(wordEntry.meanings.length).toBeGreaterThan(0);
  for (const meaning of wordEntry.meanings) {
    expect(typeof meaning).toBe('string');
    expect(meaning.length).toBeGreaterThan(0);
  }
}

/**
 * Asserts that an array of word entries represents a valid word-by-word breakdown.
 */
export function expectValidWordBreakdown(words: WordEntry[]): void {
  expect(words).toBeInstanceOf(Array);
  expect(words.length).toBeGreaterThan(0);
}
